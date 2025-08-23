'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import kbClient from "@/lib/knowlege-base.service";

export function useDocumentUpload() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ file, userId }: { file: File; userId: string }) =>
            kbClient.uploadDocumentAWS(file, userId),
        onSuccess: () => {
            // Invalidate documents list to refresh
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        },
    });
}
