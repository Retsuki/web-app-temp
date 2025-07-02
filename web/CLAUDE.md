# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Frontend Overview

This is the Next.js frontend application for the web app template project. It uses modern React patterns with Next.js 15 App Router, providing a type-safe, internationalized, and performant user interface.

### Core Technologies
- **Next.js 15.3.4** with App Router and Turbopack
- **TypeScript** for type safety
- **Tailwind CSS v4** with CSS variables
- **shadcn/ui** component library
- **React Hook Form + Zod** for forms
- **TanStack Query** for server state
- **next-intl** for i18n (ja/en)
- **Supabase** for authentication

## Architecture Patterns

### Directory Structure
```
/src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Locale routing (ja/en)
│   │   ├── (auth)/        # Auth group layout
│   │   │   ├── signin/    # Sign in page
│   │   │   └── signup/    # Sign up page
│   │   ├── (main)/        # Main app group
│   │   │   └── dashboard/ # Protected dashboard
│   │   └── page.tsx       # Home page
│   ├── auth/callback/     # OAuth callback handler
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # shadcn/ui base components
│   └── app/               # Application components
│       ├── auth/          # Auth-specific components
│       ├── button/        # Custom buttons
│       ├── input/         # Form inputs
│       └── providers/     # Context providers
├── lib/
│   ├── api/              # API client & types
│   ├── auth/             # Auth utilities
│   ├── supabase/         # Supabase clients
│   └── utils.ts          # Utility functions
├── i18n/                 # Internationalization
│   ├── routing.ts        # Locale routing config
│   └── request.ts        # Server request helpers
├── messages/             # Translation files
│   ├── ja.json          # Japanese translations
│   └── en.json          # English translations
└── middleware.ts         # Auth & i18n middleware
```

### Component Design Patterns

#### 1. UI Components (`/components/ui/`)
- Base components from shadcn/ui
- No business logic, pure presentation
- Highly reusable across features
- Example: Button, Input, Card, Dialog

#### 2. App Components (`/components/app/`)
- Application-specific components
- May contain business logic
- Composed from UI components
- Example: SignInForm, UserProfile, LanguageSwitcher

#### 3. Feature Components (in route folders)
- Page-specific components
- Tightly coupled to routes
- Can be Server or Client Components
- Example: DashboardStats, SettingsForm

### State Management Strategy

#### Server State
- **TanStack Query** for API data
- Custom hooks with `useQuery` and `useMutation`
- Automatic caching and synchronization
- Example:
```typescript
// In a Client Component
const { data, isLoading } = useUserProfile();
```

#### Client State
- **React Context** for global UI state (auth)
- **React Hook Form** for form state
- **URL state** for filters/pagination
- Local component state for UI interactions

### Form Handling Pattern
```typescript
// All forms use this pattern:
1. Zod schema for validation
2. React Hook Form for state
3. Server Action or API mutation
4. Loading/error states
5. Success feedback
```

### API Integration Architecture

#### Type-Safe API Client
```typescript
// Authenticated requests
const client = createAuthenticatedClient();
const { data } = await client.GET('/api/v1/users/profile');

// Public endpoints
const { data } = await apiClient.GET('/api/v1/health');
```

#### Data Fetching Patterns
1. **Server Components**: Direct fetch in components
2. **Client Components**: TanStack Query hooks
3. **Server Actions**: Form submissions
4. **Route Handlers**: API proxying if needed

## Routing & Middleware

### App Router Structure
- `[locale]` dynamic segment for i18n
- Route groups `(auth)` and `(main)` for layouts
- Parallel routes and intercepting routes supported
- File conventions: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`

### Middleware Chain
1. **Locale Detection**: Redirects to appropriate locale
2. **Authentication Check**: Protects routes requiring auth
3. **Route Guards**: Redirects based on auth state

### Protected Routes
- `/[locale]/(main)/*` requires authentication
- `/[locale]/(auth)/*` redirects if authenticated
- Middleware handles all redirects

## Authentication Flow

### Client-Side Auth
```typescript
// AuthContext provides:
- user: Current user object
- signIn: Email/password sign in
- signUp: Email/password sign up
- signInWithGoogle: OAuth sign in
- signOut: Clear session
- loading: Auth state loading
```

### Server-Side Auth
```typescript
// In Server Components:
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();

// In Server Actions:
const user = await getUser(); // Helper function
```

### OAuth Flow
1. User clicks "Sign in with Google"
2. Redirect to Google OAuth
3. Callback to `/auth/callback`
4. Token exchange and redirect
5. User context updated

## Styling System

### Tailwind CSS v4
- CSS variables for theming
- Light/dark mode support
- Custom color system:
  - Primary: Mindaro (#90d80a)
  - Secondary: Deep green (#44670d)

### Component Styling Pattern
```typescript
// Use cn() utility for conditional classes
import { cn } from '@/lib/utils';

className={cn(
  "base-classes",
  isActive && "active-classes",
  className // Allow override
)}
```

### CSS Variables
- Defined in `globals.css`
- Semantic naming (--primary, --background)
- Automatic dark mode switching

## Performance Optimization

### Server Components by Default
- All components are Server Components unless 'use client'
- Reduces client bundle size
- Better initial load performance

### Data Fetching
- Parallel data fetching in Server Components
- Request memoization with React cache()
- Streaming with Suspense boundaries

### Image Optimization
- Use `next/image` for all images
- Automatic format conversion
- Lazy loading by default

### Code Splitting
- Automatic route-based splitting
- Dynamic imports for heavy components
- Turbopack for fast dev builds

## Development Guidelines

### Component Creation Checklist
1. Decide: Server or Client Component?
2. Choose appropriate directory
3. Implement with TypeScript
4. Add proper error boundaries
5. Include loading states
6. Test with both locales
7. Verify mobile responsiveness

### Form Development Pattern
1. Define Zod schema
2. Create form component with React Hook Form
3. Implement submission handler
4. Add loading/error states
5. Test validation
6. Add success feedback

### API Integration Steps
1. Check if endpoint exists in OpenAPI
2. Run `npm run api:schema` if needed
3. Use appropriate client (auth/public)
4. Handle loading/error states
5. Implement proper TypeScript types

### Debugging Tips
- Use React DevTools for component inspection
- Check Network tab for API calls
- Verify auth tokens in Application tab
- Use `console.log` in Server Components
- Check browser console for client errors

## Common Patterns

### Loading States
```typescript
// Use Suspense for Server Components
<Suspense fallback={<LoadingSkeleton />}>
  <AsyncComponent />
</Suspense>

// Use loading state for Client Components
if (isLoading) return <Spinner />;
```

### Error Handling
```typescript
// Error boundaries for components
// try-catch for Server Actions
// Error states in React Query
// Toast notifications for user feedback
```

### Empty States
```typescript
if (!data || data.length === 0) {
  return <EmptyState message={t('no-data')} />;
}
```

## Testing Strategy

### Current State
- No test framework implemented yet
- Rely on TypeScript for type safety
- Manual testing required

### Recommended Approach
1. Component testing with React Testing Library
2. E2E testing with Playwright
3. API mocking with MSW
4. Accessibility testing

## Deployment Considerations

### Environment Variables
- Use `.env.local` for local development
- Never commit secrets
- Validate all env vars at build time

### Build Optimization
- Run `npm run build` to check for errors
- Monitor bundle size
- Use dynamic imports for large components
- Implement proper caching headers

### Performance Monitoring
- Use Next.js built-in analytics
- Monitor Core Web Vitals
- Set up error tracking (Sentry)
- Monitor API response times

## Important Notes

### Always Remember
1. **Server Components First**: Only use Client Components when needed
2. **Type Safety**: Leverage TypeScript fully
3. **Accessibility**: Use semantic HTML and ARIA labels
4. **Mobile First**: Design for mobile, enhance for desktop
5. **Performance**: Measure and optimize
6. **Security**: Never expose sensitive data
7. **Code Quality**: Run `npm run lint` before commits

### Common Pitfalls to Avoid
- Don't use Client Components unnecessarily
- Avoid large client-side bundles
- Don't fetch data in multiple places
- Avoid prop drilling (use Context/Query)
- Don't ignore TypeScript errors
- Avoid inline styles (use Tailwind)
- Don't skip loading/error states

### Quick Commands
```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run linter
npm run gen:api      # Generate API types

# Code Quality
npm run check        # Biome check
npm run check:apply  # Fix issues
npm run format       # Format code
```