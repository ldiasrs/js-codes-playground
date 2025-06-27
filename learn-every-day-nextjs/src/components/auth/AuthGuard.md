# AuthGuard Component

The `AuthGuard` component is a reusable authentication wrapper that handles authentication checks and redirects for React components.

## Features

- **Authentication Protection**: Redirects unauthenticated users to a specified page
- **Reverse Protection**: Redirects authenticated users away from auth pages (login, register, etc.)
- **Loading States**: Shows loading spinner while checking authentication state
- **Customizable**: Supports custom loading components and redirect destinations
- **TypeScript Support**: Fully typed with TypeScript interfaces

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | The content to render if authentication check passes |
| `redirectTo` | `string` | `'/lending'` | Where to redirect if authentication check fails |
| `requireAuth` | `boolean` | `true` | If `true`, redirects unauthenticated users. If `false`, redirects authenticated users |
| `loadingComponent` | `React.ReactNode` | - | Custom loading component to show while checking auth state |

## Usage Examples

### Protecting a Page (Require Authentication)

```tsx
import { AuthGuard } from '../components/auth/AuthGuard';

export default function ProtectedPage() {
  return (
    <AuthGuard requireAuth={true} redirectTo="/login">
      <div>This content is only visible to authenticated users</div>
    </AuthGuard>
  );
}
```

### Preventing Authenticated Users from Accessing Auth Pages

```tsx
import { AuthGuard } from '../components/auth/AuthGuard';

export default function LoginPage() {
  return (
    <AuthGuard requireAuth={false}>
      <LoginForm />
    </AuthGuard>
  );
}
```

### Custom Loading Component

```tsx
import { AuthGuard } from '../components/auth/AuthGuard';

export default function CustomLoadingPage() {
  const customLoading = (
    <div className="custom-loading">
      <p>Checking authentication...</p>
    </div>
  );

  return (
    <AuthGuard 
      requireAuth={true} 
      loadingComponent={customLoading}
    >
      <div>Protected content</div>
    </AuthGuard>
  );
}
```

## How It Works

1. **Initialization**: The component uses the `useAuth` hook to get authentication state
2. **Loading State**: While `isLoading` is `true`, shows loading component
3. **Authentication Check**: 
   - If `requireAuth={true}` and user is not authenticated → redirects to `redirectTo`
   - If `requireAuth={false}` and user is authenticated → redirects to `/topics`
4. **Render Content**: If authentication check passes, renders children

## Integration with useAuth Hook

The AuthGuard component relies on the `useAuth` hook which provides:
- `isAuthenticated`: boolean indicating if user is logged in
- `isLoading`: boolean indicating if auth state is being determined
- `user`: user data object
- `logout`: function to log out user

## Best Practices

1. **Use for Page-Level Protection**: Wrap entire page components with AuthGuard
2. **Consistent Redirects**: Use consistent redirect destinations across your app
3. **Loading UX**: Provide meaningful loading states for better user experience
4. **Error Handling**: The component handles authentication errors gracefully

## Migration from Manual Auth Checks

Before (duplicated code):
```tsx
export default function Page() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return null;

  return <div>Content</div>;
}
```

After (using AuthGuard):
```tsx
export default function Page() {
  return (
    <AuthGuard requireAuth={true} redirectTo="/login">
      <div>Content</div>
    </AuthGuard>
  );
}
``` 