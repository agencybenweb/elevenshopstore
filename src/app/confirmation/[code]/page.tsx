import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import ConfirmationContent from './ConfirmationContent';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Commande #${code} — Eleven Shop Roanne`,
    description: `Suivi en temps réel de votre commande #${code} à Roanne.`,
  };
}

export default function ConfirmationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center pt-28">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ConfirmationContent params={params} />
    </Suspense>
  );
}
