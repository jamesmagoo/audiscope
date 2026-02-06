# Data Management with React Query

AudiScope uses TanStack React Query v5 for efficient server state management, caching, and synchronization.

## React Query Architecture

**Provider Setup:**
- `components/providers/query-provider.tsx` - QueryClient configuration and provider
- `app/layout.tsx` - Root layout wrapped with QueryProvider
- React Query DevTools enabled in development (top-right corner)

**Provider Hierarchy:**
```typescript
<QueryProvider>
  <ThemeProvider>
    <AuthProvider>
      {children}
    </AuthProvider>
  </ThemeProvider>
  <ReactQueryDevtools initialIsOpen={false} buttonPosition={'top-right'}/>
</QueryProvider>
```

## QueryClient Configuration

The QueryClient is configured with default settings in `components/providers/query-provider.tsx`:

```typescript
const [queryClient] = useState(() => new QueryClient());
```

## Development Tools

**React Query DevTools:**
- Available in development mode only
- Positioned at top-right of screen
- Provides real-time query state inspection
- Shows cached data, loading states, and refetch controls
- Helps debug query behavior and performance

## Integration with Authentication

React Query works seamlessly with the JWT authentication system:
- Queries automatically include authentication headers via `lib/api-utils.ts`
- Failed authentication (401/403) triggers automatic token refresh
- Query invalidation on authentication state changes
- Cached data respects user context and permissions

## Recommended Query Patterns

**Query Keys:**
Use consistent, hierarchical query keys that include user context:
```typescript
const queryKey = ['assessments', userId, { status }];
const queryKey = ['assessment', assessmentId, userId];
```

**Mutations:**
Combine mutations with optimistic updates and query invalidation:
```typescript
const mutation = useMutation({
  mutationFn: submitAssessment,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['assessments'] });
  }
});
```

**Error Handling:**
Leverage React Query's built-in error handling with authentication:
```typescript
const { data, error, isLoading } = useQuery({
  queryKey: ['assessments'],
  queryFn: () => getAssessments(),
  retry: (failureCount, error) => {
    // Don't retry auth errors
    if (error.status === 401 || error.status === 403) return false;
    return failureCount < 3;
  }
});
```

## Performance Benefits

- **Automatic Caching**: Reduces redundant API calls
- **Background Updates**: Keeps data fresh without blocking UI
- **Request Deduplication**: Multiple identical requests are batched
- **Optimistic Updates**: Immediate UI feedback for mutations
- **Infinite Queries**: Efficient pagination for large datasets
- **Prefetching**: Anticipate user navigation and data needs
