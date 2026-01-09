'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import productChatClient, {
  type ChatSession,
  type GetSessionResult,
  type SendMessageResult,
  type StartSessionResult
} from '@/lib/product-chat.service'

/**
 * Query: List all chat sessions for a product
 */
export function useProductSessions(productId: string | null) {
  return useQuery({
    queryKey: ['product-sessions', productId],
    queryFn: () => productId ? productChatClient.listSessions(productId) : null,
    enabled: !!productId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Query: Get a specific chat session with full message history
 */
export function useChatSession(sessionId: string | null) {
  return useQuery({
    queryKey: ['chat-session', sessionId],
    queryFn: () => sessionId ? productChatClient.getSession(sessionId) : null,
    enabled: !!sessionId,
    staleTime: 1000 * 30, // 30 seconds (more frequent refresh for active chat)
  })
}

/**
 * Mutation: Start a new chat session
 */
export function useStartSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      productId,
      sessionType,
      title
    }: {
      productId: string
      sessionType: 'qa' | 'practice' | 'concept'
      title?: string
    }) => productChatClient.startChatSession(productId, sessionType, title),
    onSuccess: (data: StartSessionResult, variables) => {
      // Invalidate the product sessions list
      queryClient.invalidateQueries({
        queryKey: ['product-sessions', variables.productId]
      })

      // Pre-populate the session cache with empty messages
      queryClient.setQueryData(['chat-session', data.session_id], {
        ...data,
        messages: [],
        message_count: 0
      })

      console.log('useStartSession: Session created:', data.session_id)
    },
  })
}

/**
 * Mutation: Send a message in a chat session
 */
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      content
    }: {
      sessionId: string
      content: string
    }) => productChatClient.sendMessage(sessionId, content),
    onSuccess: (data: SendMessageResult, variables) => {
      // Get the current session data from cache
      const currentSession = queryClient.getQueryData<GetSessionResult>([
        'chat-session',
        variables.sessionId
      ])

      if (currentSession) {
        // Filter out temporary optimistic messages (they start with 'temp-')
        const messagesWithoutTemp = (currentSession.messages || []).filter(
          (msg) => !msg.id.startsWith('temp-')
        )

        // Update the session with real messages from API
        queryClient.setQueryData(['chat-session', variables.sessionId], {
          ...currentSession,
          messages: [
            ...messagesWithoutTemp,
            data.user_message,
            data.assistant_message
          ],
          message_count: (currentSession.message_count || 0) + 2,
          last_message_at: data.assistant_message.created_at
        })
      }

      // Invalidate the sessions list to update last_message_at and message_count
      const productId = currentSession?.product_id
      if (productId) {
        queryClient.invalidateQueries({
          queryKey: ['product-sessions', productId]
        })
      }

      console.log('useSendMessage: Message sent, tokens used:', data.tokens_used)
    },
  })
}

/**
 * Mutation: Delete a chat session
 */
export function useDeleteSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => productChatClient.deleteSession(sessionId),
    onSuccess: (_, sessionId) => {
      // Remove the session from cache
      queryClient.removeQueries({
        queryKey: ['chat-session', sessionId]
      })

      // Invalidate all product sessions lists (we don't know which product this belongs to)
      queryClient.invalidateQueries({
        queryKey: ['product-sessions']
      })

      console.log('useDeleteSession: Session deleted:', sessionId)
    },
  })
}

/**
 * Combined hook for managing chat state in a product
 */
export function useProductChat(productId: string | null) {
  const { data: sessionsData, isLoading: sessionsLoading, error: sessionsError } = useProductSessions(productId)
  const startSession = useStartSession()
  const deleteSession = useDeleteSession()

  return {
    sessions: sessionsData?.sessions || [],
    totalCount: sessionsData?.total_count || 0,
    isLoading: sessionsLoading,
    error: sessionsError,
    startSession: startSession.mutate,
    deleteSession: deleteSession.mutate,
    isStarting: startSession.isPending,
    isDeleting: deleteSession.isPending,
  }
}
