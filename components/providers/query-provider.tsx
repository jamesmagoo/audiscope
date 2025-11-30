"use client"

import {useState, useEffect, useCallback, useRef} from "react";
import {QueryClient, QueryClientProvider, QueryCache, MutationCache} from "@tanstack/react-query";
import {useAuth} from "@/components/providers/auth-provider";
import {useRouter} from "next/navigation";
import {useToast} from "@/hooks/use-toast";
import {AuthenticationError} from "@/lib/auth-error";

interface Props {
    children: React.ReactNode
}

export default function QueryProvider({children}: Props) {
    const {signOutUser} = useAuth();
    const router = useRouter();
    const {toast} = useToast();

    // Use ref to track if we're already handling an auth error (prevent duplicate toasts/redirects)
    const isHandlingAuthError = useRef(false);

    /**
     * Handle authentication errors by showing a toast,
     * signing out the user, and redirecting to login
     */
    const handleAuthError = useCallback(async (error: AuthenticationError) => {
        // Prevent duplicate error handling
        if (isHandlingAuthError.current) {
            console.log('Already handling auth error, skipping duplicate');
            return;
        }

        isHandlingAuthError.current = true;
        console.error('Authentication error detected:', error.message);

        // Show toast notification
        toast({
            variant: "destructive",
            title: "Session Expired",
            description: error.message || "Your session has expired. Please sign in again.",
            duration: 5000,
        });

        try {
            // Sign out the user and clear session
            await signOutUser();

            // Redirect to login page
            router.push('/login');
        } catch (signOutError) {
            console.error('Error during sign out:', signOutError);
            // Still redirect even if sign out fails
            router.push('/login');
        } finally {
            // Reset flag after a delay to allow new sessions
            setTimeout(() => {
                isHandlingAuthError.current = false;
            }, 1000);
        }
    }, [signOutUser, router, toast]);

    // Create QueryClient with QueryCache and MutationCache that handle errors
    const [queryClient] = useState(() => {
        const queryCache = new QueryCache({
            onError: (error) => {
                if (AuthenticationError.isAuthError(error)) {
                    // Queue the error handler to run after render
                    setTimeout(() => handleAuthError(error), 0);
                }
            },
        });

        const mutationCache = new MutationCache({
            onError: (error) => {
                if (AuthenticationError.isAuthError(error)) {
                    // Queue the error handler to run after render
                    setTimeout(() => handleAuthError(error), 0);
                }
            },
        });

        return new QueryClient({
            queryCache,
            mutationCache,
            defaultOptions: {
                queries: {
                    // Prevent automatic retries on authentication errors
                    retry: (failureCount, error) => {
                        if (AuthenticationError.isAuthError(error)) {
                            return false;
                        }
                        return failureCount < 3;
                    },
                },
            },
        });
    });

    // Update the error handler when dependencies change
    useEffect(() => {
        const queryCache = queryClient.getQueryCache();
        const mutationCache = queryClient.getMutationCache();

        // Update the onError handlers with current handler
        queryCache.config.onError = (error) => {
            if (AuthenticationError.isAuthError(error)) {
                handleAuthError(error);
            }
        };

        mutationCache.config.onError = (error) => {
            if (AuthenticationError.isAuthError(error)) {
                handleAuthError(error);
            }
        };
    }, [queryClient, handleAuthError]);

    return (
        <QueryClientProvider client={queryClient}> {children}</QueryClientProvider>
    )
}
