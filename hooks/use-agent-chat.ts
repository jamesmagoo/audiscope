'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
import type { AgentSubscriber } from '@ag-ui/client';
import { AgentConnection } from '@/lib/agent/agent-connection';
import { WebSocketAgent } from '@/lib/agent/websocket-agent';
import { useToast } from '@/hooks/use-toast';
import { CHAT_EVENTS, ERROR_EVENTS } from '@/lib/analytics/posthog-events';
import type { MessageType } from '@/components/assistant/message';

export type AgentChatStatus = 'idle' | 'streaming' | 'error';

export interface UseAgentChatResult {
    /** Server-resolved session id (may differ from the selected one for new chats). */
    sessionId: string | null;
    /** Session history plus the live turn, ready to render. */
    messages: MessageType[];
    status: AgentChatStatus;
    /** True between send and first streamed token — render the "Thinking…" bubble. */
    isAwaiting: boolean;
    error: string | null;
    /** True until the connection's MESSAGES_SNAPSHOT arrives for an existing session. */
    historyLoading: boolean;
    historyError: Error | null;
    sendMessage: (content: string) => Promise<void>;
    cancel: () => void;
}

// The socket is the single source of truth for messages: MESSAGES_SNAPSHOT on
// connect seeds `committed`, each finished turn appends to it, and the live
// (in-flight) turn overlays it until then. A reconnect's snapshot resyncs
// everything — including discarding cancelled-turn remnants, matching the
// server's discard-all cancel semantics.
interface ChatState {
    committed: MessageType[];
    phase: 'idle' | 'awaiting' | 'streaming';
    pendingUser: MessageType | null;
    draft: { id: string; content: string } | null;
}

type ChatAction =
    | { type: 'snapshot'; messages: MessageType[] }
    | { type: 'send'; message: MessageType }
    | { type: 'draft-start'; id: string }
    | { type: 'draft-content'; content: string }
    | { type: 'commit-turn'; messages: MessageType[] }
    | { type: 'turn-done' }
    | { type: 'reset' };

const initialState: ChatState = { committed: [], phase: 'idle', pendingUser: null, draft: null };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
    switch (action.type) {
        case 'snapshot':
            // Server truth replaces committed history (dropping e.g.
            // cancelled-turn remnants on reconnect) but must NOT touch the live
            // turn: on a new chat's first send the connection opens lazily
            // AFTER the user's message is already pending, and the fresh
            // session's empty snapshot arrives mid-turn.
            return { ...state, committed: action.messages };
        case 'send':
            return { ...state, phase: 'awaiting', pendingUser: action.message, draft: null };
        case 'draft-start':
            return { ...state, phase: 'streaming', draft: { id: action.id, content: '' } };
        case 'draft-content':
            return state.draft
                ? { ...state, draft: { ...state.draft, content: action.content } }
                : state;
        case 'commit-turn':
            return {
                committed: [...state.committed, ...action.messages],
                phase: 'idle',
                pendingUser: null,
                draft: null,
            };
        case 'turn-done':
            return { ...state, phase: 'idle', pendingUser: null, draft: null };
        case 'reset':
            return initialState;
        default:
            return state;
    }
}

export function useAgentChat(
    selectedSessionId: string | null,
    /** Fires only when the server mints a fresh session id (new chat, first send). */
    onSessionCreated?: (sessionId: string) => void,
): UseAgentChatResult {
    const queryClient = useQueryClient();
    const posthog = usePostHog();
    const { toast } = useToast();

    const connectionRef = useRef<AgentConnection | null>(null);
    const agentRef = useRef<WebSocketAgent | null>(null);
    const sessionWasNewRef = useRef(false);
    const onSessionCreatedRef = useRef(onSessionCreated);
    onSessionCreatedRef.current = onSessionCreated;
    const conversationCreatedTrackedRef = useRef(false);
    const messageStartTimeRef = useRef<number>(0);

    const [resolvedSessionId, setResolvedSessionId] = useState<string | null>(selectedSessionId);
    const [status, setStatus] = useState<AgentChatStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [historyReady, setHistoryReady] = useState(selectedSessionId === null);
    const [historyError, setHistoryError] = useState<Error | null>(null);
    const [chat, dispatch] = useReducer(chatReducer, initialState);

    const disposeConnection = useCallback(() => {
        connectionRef.current?.close();
        connectionRef.current = null;
        agentRef.current = null;
    }, []);

    const getOrCreateConnection = useCallback((): AgentConnection => {
        if (connectionRef.current) return connectionRef.current;

        const connection = new AgentConnection();
        connection.onBusy = () => {
            toast({
                title: 'Assistant is still responding',
                description: 'Wait for the current reply to finish (or stop it) before sending.',
            });
        };
        connection.onSessionResolved = (resolved) => {
            setResolvedSessionId(resolved.sessionId);
            if (resolved.isNew) {
                sessionWasNewRef.current = true;
                conversationCreatedTrackedRef.current = false;
                // Event-driven (not derived from state in an effect): deriving
                // it races with "New Chat" clearing the selected session and
                // would re-adopt the old id.
                onSessionCreatedRef.current?.(resolved.sessionId);
            }
        };
        connection.onMessagesSnapshot = (snapshotMessages) => {
            dispatch({
                type: 'snapshot',
                messages: snapshotMessages.map((msg) => ({
                    id: msg.id,
                    content: msg.content,
                    sender: msg.role,
                    timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
                })),
            });
            setHistoryReady(true);
            setHistoryError(null);
        };
        connectionRef.current = connection;
        agentRef.current = new WebSocketAgent(connection);
        return connection;
    }, [toast]);

    // Session switching. When the page adopts the id this hook just resolved
    // (new chat -> SESSION_RESOLVED -> parent state update), the live
    // connection is already bound to it — keep it. Disposal on prop change
    // happens here, NOT in this effect's cleanup: a cleanup would also run on
    // the adoption transition and kill the connection mid-stream.
    useEffect(() => {
        if (selectedSessionId && connectionRef.current?.sessionId === selectedSessionId) {
            return;
        }

        disposeConnection();
        dispatch({ type: 'reset' });
        setStatus('idle');
        setError(null);
        setResolvedSessionId(selectedSessionId);
        setHistoryError(null);
        // New chat has no history to wait for; an existing session's history
        // arrives with the connection's MESSAGES_SNAPSHOT.
        setHistoryReady(selectedSessionId === null);
        sessionWasNewRef.current = false;

        // Existing session: connect eagerly — the snapshot renders the history.
        // New chat (null): connect lazily on first send, so page views don't
        // mint empty server sessions.
        if (selectedSessionId) {
            const connection = getOrCreateConnection();
            connection.connect(selectedSessionId).catch((err) => {
                console.error('Agent connection failed:', err);
                setHistoryError(err instanceof Error ? err : new Error(String(err)));
            });
        }
    }, [selectedSessionId, disposeConnection, getOrCreateConnection]);

    // Unmount-only teardown.
    useEffect(() => disposeConnection, [disposeConnection]);

    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim()) return;
            if (status === 'streaming') return;

            setError(null);
            setStatus('streaming');
            messageStartTimeRef.current = Date.now();

            const userMessage: MessageType = {
                id: `user-${Date.now()}`,
                content,
                sender: 'user',
                timestamp: new Date(),
            };
            dispatch({ type: 'send', message: userMessage });

            posthog?.capture(CHAT_EVENTS.MESSAGE_SENT, {
                conversationId: resolvedSessionId ?? 'new',
                messageLength: content.length,
            });

            const connection = getOrCreateConnection();
            const agent = agentRef.current!;

            // Captured locally (not from React state): subscriber callbacks fire
            // faster than renders, so state could miss the final chunk.
            let assistantId: string | null = null;
            let assistantText = '';
            let reachedTerminalState = false;

            const subscriber: AgentSubscriber = {
                onTextMessageStartEvent: ({ event }) => {
                    assistantId = event.messageId;
                    dispatch({ type: 'draft-start', id: event.messageId });
                },
                onTextMessageContentEvent: ({ textMessageBuffer }) => {
                    assistantText = textMessageBuffer;
                    dispatch({ type: 'draft-content', content: textMessageBuffer });
                },
                onTextMessageEndEvent: ({ textMessageBuffer }) => {
                    assistantText = textMessageBuffer;
                },
                onRunFinishedEvent: () => {
                    reachedTerminalState = true;
                    const sessionId = connection.sessionId;
                    dispatch({
                        type: 'commit-turn',
                        messages: [
                            userMessage,
                            ...(assistantId
                                ? [
                                      {
                                          id: assistantId,
                                          content: assistantText,
                                          sender: 'assistant' as const,
                                          timestamp: new Date(),
                                      },
                                  ]
                                : []),
                        ],
                    });
                    setStatus('idle');
                    // Sidebar ordering/title/count (and first appearance of a
                    // new session) come from the list endpoint.
                    queryClient.invalidateQueries({ queryKey: ['agent-sessions'] });

                    posthog?.capture(CHAT_EVENTS.MESSAGE_RECEIVED, {
                        conversationId: sessionId,
                        responseTime: Math.round((Date.now() - messageStartTimeRef.current) / 1000),
                        responseLength: assistantText.length,
                    });
                    if (sessionWasNewRef.current && !conversationCreatedTrackedRef.current) {
                        conversationCreatedTrackedRef.current = true;
                        posthog?.capture(CHAT_EVENTS.CONVERSATION_CREATED, {
                            conversationId: sessionId,
                        });
                    }
                },
                onRunErrorEvent: ({ event }) => {
                    reachedTerminalState = true;
                    const code = (event as { code?: string }).code;

                    if (code === 'interrupted') {
                        // User cancelled. The server discards the whole turn, but
                        // keep it on screen; the next reconnect's snapshot
                        // restores server truth.
                        dispatch({
                            type: 'commit-turn',
                            messages: [
                                userMessage,
                                ...(assistantId && assistantText
                                    ? [
                                          {
                                              id: assistantId,
                                              content: assistantText,
                                              sender: 'assistant' as const,
                                              timestamp: new Date(),
                                          },
                                      ]
                                    : []),
                            ],
                        });
                        setStatus('idle');
                        return;
                    }

                    if (code === 'connection_lost') {
                        setError('Connection to the assistant was lost. Please try again.');
                    } else {
                        setError(event.message || 'The assistant ran into a problem.');
                    }
                    dispatch({ type: 'turn-done' });
                    setStatus('error');
                    posthog?.capture(ERROR_EVENTS.WEBSOCKET_ERROR, {
                        code: code ?? 'unknown',
                        sessionId: connection.sessionId,
                    });
                },
                onRunFailed: ({ error: runError }) => {
                    reachedTerminalState = true;
                    console.error('Agent run failed:', runError);
                    setError('The assistant ran into a problem. Please try again.');
                    dispatch({ type: 'turn-done' });
                    setStatus('error');
                    posthog?.capture(ERROR_EVENTS.WEBSOCKET_ERROR, {
                        code: 'run_failed',
                        sessionId: connection.sessionId,
                        message: runError instanceof Error ? runError.message : String(runError),
                    });
                },
            };

            try {
                // The server owns history; only the new user message is passed.
                agent.setMessages([{ id: userMessage.id, role: 'user', content }]);
                await agent.runAgent({}, subscriber);
                // A run that completed without any terminal event was rejected
                // (server busy — e.g. a concurrent turn from another tab).
                if (!reachedTerminalState) {
                    dispatch({ type: 'turn-done' });
                    setStatus('idle');
                }
            } catch (err) {
                console.error('Agent run threw:', err);
                setError('Could not reach the assistant. Please try again.');
                dispatch({ type: 'turn-done' });
                setStatus('error');
            }
        },
        [status, resolvedSessionId, posthog, queryClient, getOrCreateConnection],
    );

    const cancel = useCallback(() => {
        agentRef.current?.abortRun();
    }, []);

    const messages: MessageType[] = useMemo(() => {
        const result = [...chat.committed];
        if (chat.pendingUser) result.push(chat.pendingUser);
        if (chat.draft) {
            result.push({
                id: chat.draft.id,
                content: chat.draft.content,
                sender: 'assistant',
                timestamp: new Date(),
                isStreaming: chat.phase === 'streaming',
            });
        }
        return result;
    }, [chat]);

    return {
        sessionId: resolvedSessionId,
        messages,
        status,
        isAwaiting: chat.phase === 'awaiting',
        error,
        historyLoading: !!selectedSessionId && !historyReady && !historyError,
        historyError,
        sendMessage,
        cancel,
    };
}
