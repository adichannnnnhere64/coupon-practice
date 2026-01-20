// src/router.ts
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

// This is the ONLY correct way with Zustand + TanStack Router
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadDelay: 200,

  // This runs on every navigation — always fresh auth state
  context: {
    auth: undefined!, // we'll inject real values in main.tsx
  },
});

// Register things for TS
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
