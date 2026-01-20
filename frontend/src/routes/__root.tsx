import * as React from 'react';
import {
  Outlet,
  ScrollRestoration,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import '../App.css';
import { useAuthStore } from '../stores/useAuthStore';

interface RouterContext {
  auth: ReturnType<typeof useAuthStore>;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <React.Fragment>
      <ScrollRestoration />
      <Outlet />
    </React.Fragment>
  );
}
