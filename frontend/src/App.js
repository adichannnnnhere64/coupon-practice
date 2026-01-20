import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
    return (_jsx(_Fragment, { children: _jsx(QueryClientProvider, { client: queryClient, children: _jsx(AppLayout, { children: _jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-3xl font-bold", children: "Welcome to Swag" }), _jsx("p", { className: "mt-4 text-base-content/80", children: "This is your main content. The navbar and dock stay fixed." })] }) }) }) }));
}
export default App;
