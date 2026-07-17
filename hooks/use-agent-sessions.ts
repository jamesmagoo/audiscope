'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import agentClient from '@/lib/agent.service';
import type { AgentSession } from '@/lib/agent/types';

export function useAgentSessions() {
    return useQuery<AgentSession[]>({
        queryKey: ['agent-sessions'],
        queryFn: () => agentClient.listAgentSessions(),
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

export function useDeleteAgentSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (sessionId: string) => agentClient.deleteAgentSession(sessionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-sessions'] });
        },
    });
}
