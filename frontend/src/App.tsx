import './App.css';
import AppLayout from './layouts/AppLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { httpBatchLink } from '@trpc/client'; // optional

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <AppLayout>
          <div className="p-6">
            <h1 className="text-3xl font-bold">Welcome to Swag</h1>
            <p className="mt-4 text-base-content/80">
              This is your main content. The navbar and dock stay fixed.
            </p>
          </div>
        </AppLayout>
      </QueryClientProvider>
    </>
  );
}

export default App;
