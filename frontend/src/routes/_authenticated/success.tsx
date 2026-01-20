// routes/success.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/success')({
  component: ScamSuccess,
});

function ScamSuccess() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="text-center max-w-4xl">
        {/* Big evil text */}
        <h1 className="text-6xl sm:text-8xl font-black text-red-600 mb-8 animate-pulse">
          THANK YOU BITCH!
        </h1>

        <h2 className="text-4xl sm:text-6xl font-extrabold mb-6 text-green-500">
          You have been successfully SCAMMED
        </h2>

        <div className="text-2xl sm:text-3xl space-y-4 text-gray-300">
          <p>Your card has been charged.</p>
          <p>Your data has been sold.</p>
          <p>Your soul now belongs to us.</p>
        </div>

        {/* Evil laughing */}
        <div className="mt-12 text-9xl animate-bounce"></div>

        <div className="mt-16">
          <p className="text-xl text-red-500 font-bold">
            There is no refund. There is no escape.
          </p>
          <p className="text-gray-500 mt-4">
            Refresh? Too late. We already have everything.
          </p>
        </div>

        {/* Fake "support" */}
        <div className="mt-20 text-sm text-gray-600">
          <p>Need help? Call our support: 1-666-DEVIL-666</p>
          <p className="text-xs mt-2">We're not sorry.</p>
        </div>
      </div>
    </div>
  );
}
