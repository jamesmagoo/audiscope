'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import kbClient, { type Chat, type ChatResponse, type ChatMessage } from "@/lib/knowlege-base.service";

export function useChats() {
    return useQuery({
        queryKey: ['chats'],
        queryFn: () => {
            console.log('useChats: Fetching chats...')
            return kbClient.getChats()
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useChat(chatId: string | null) {
    return useQuery({
        queryKey: ['chat', chatId],
        queryFn: () => chatId ? kbClient.getChatById(chatId) : null,
        enabled: !!chatId,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

export function useChatMessages(chatId: string | null) {
    return useQuery({
        queryKey: ['chat-messages', chatId],
        queryFn: () => chatId ? kbClient.getChatMessages(chatId) : null,
        enabled: !!chatId,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

export function useSendMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ 
            content, 
            chatId, 
            knowledgeBaseId 
        }: { 
            content: string; 
            chatId?: string; 
            knowledgeBaseId?: string; 
        }) => kbClient.sendMessage(content, chatId, knowledgeBaseId),
        onSuccess: (data: ChatResponse, variables) => {
            // Update chat list
            queryClient.invalidateQueries({ queryKey: ['chats'] });
            
            // Update specific chat if it exists
            if (data.chat) {
                queryClient.setQueryData(['chat', data.chat.id], data.chat);
                
                // Update messages cache with the new messages
                if (data.messages) {
                    queryClient.setQueryData(['chat-messages', data.chat.id], data.messages);
                }
                
                // If this was a new conversation, also update the active chat
                if (!variables.chatId) {
                    queryClient.setQueryData(['chat', data.chat.id], data.chat);
                }
            }
        },
    });
}

export function useDeleteChat() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (chatId: string) => {
            // Note: This endpoint doesn't exist in your API yet
            throw new Error('Delete chat endpoint not implemented in API');
        },
        onSuccess: (_, chatId) => {
            // Remove from chat list
            queryClient.invalidateQueries({ queryKey: ['chats'] });
            // Remove specific chat data
            queryClient.removeQueries({ queryKey: ['chat', chatId] });
        },
    });
}

// Document Upload Hook (Updated)
export function useDocumentUpload() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ 
            file, 
            knowledgeBaseId 
        }: { 
            file: File; 
            knowledgeBaseId: string; 
        }) => kbClient.uploadDocumentAWS(file, knowledgeBaseId),
        onSuccess: () => {
            // Invalidate documents list to refresh (when we have document listing)
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        },
    });
}

// Document Management Hooks (Placeholders for future API endpoints)
export function useDocuments() {
    return useQuery({
        queryKey: ['documents'],
        queryFn: async () => {
            // This endpoint doesn't exist yet in your API
            // You'll need to implement: GET /v1/knowledge-base/aws/documents
            throw new Error('Documents listing endpoint not implemented in API');
        },
        enabled: false, // Disable until API is available
    });
}

export function useDeleteDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (documentId: string) => {
            // This endpoint doesn't exist yet in your API
            // You'll need to implement: DELETE /v1/knowledge-base/aws/documents/{doc_id}
            throw new Error('Delete document endpoint not implemented in API');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        },
    });
}

// Custom hooks for specific UI needs
export function useCreateConversation() {
    const sendMessage = useSendMessage();
    
    return {
        createAndSendMessage: (content: string, knowledgeBaseId?: string) => 
            sendMessage.mutate({ content, knowledgeBaseId }),
        ...sendMessage
    };
}

// Hook for managing conversation state in UI
export function useConversationState() {
    const queryClient = useQueryClient();
    
    const updateConversationTitle = (chatId: string, title: string) => {
        queryClient.setQueryData(['chat', chatId], (oldData: Chat | undefined) => 
            oldData ? { ...oldData, title } : undefined
        );
    };

    const addOptimisticMessage = (chatId: string, message: ChatMessage) => {
        // Add optimistic message for immediate UI feedback
        // This would work with a messages cache when available
    };

    return {
        updateConversationTitle,
        addOptimisticMessage,
    };
}

// Environment configuration hook
export function useKnowledgeBaseConfig() {
    const knowledgeBaseId = process.env.NEXT_PUBLIC_KNOWLEDGE_BASE_ID || 'default';
    const tenantId = 'default'; // You may want to get this from JWT or user context
    
    return {
        knowledgeBaseId,
        tenantId,
    };
}
