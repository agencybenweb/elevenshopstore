import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mentions Légales — Eleven Shop Roanne',
  description: 'Mentions légales et informations éditeur d’Eleven Shop à Roanne.',
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen pt-28 pb-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <h1 className="font-display text-4xl tracking-wide text-white md:text-5xl mb-6">
          MENTIONS LÉGALES
        </h1>

        <div className="rounded-3xl border border-white/10 bg-surface-elevated p-6 md:p-10 space-y-8 text-sm text-white/80 leading-relaxed">
          <section>
            <h2 className="font-display text-xl text-primary mb-2">1. ÉDITEUR DU SITE</h2>
            <p>
              Le site <strong>Eleven Shop</strong> (accessible à l'adresse elevenshop.fr) est édité par l’entreprise Eleven Shop,
              spécialisée dans la vente au détail et la livraison à domicile de produits d'épicerie, snacks et boissons 24h/24.
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-text-muted">
              <li>Siège social : Roanne (42300), France</li>
              <li>Activité : Épicerie nocturne et livraison à domicile</li>
              <li>Zone de chalandise : Roanne et agglomération roannaise (42300, 42120, 42153, 42370)</li>
              <li>Contact : contact@elevenshop.fr</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-primary mb-2">2. HÉBERGEMENT</h2>
            <p>
              Le site est hébergé par la société <strong>Vercel Inc.</strong>, située 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.
              La base de données et les services d'authentification sont opérés par <strong>Supabase Inc.</strong>, 970 Toa Payoh North #07-04, Singapour.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-primary mb-2">3. PROPRIÉTÉ INTELLECTUELLE</h2>
            <p>
              L’ensemble des éléments visuels, textuels, logos, animations et charte graphique présents sur ce site relèvent de la législation française
              et internationale sur le droit d'auteur et la propriété intellectuelle. Toute reproduction intégrale ou partielle sans autorisation expresse
              est interdite. Les marques citées (Monster, Red Bull, Coca-Cola, Lay's, etc.) sont la propriété exclusive de leurs détenteurs respectifs.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-primary mb-2">4. PROTECTION DES MINEURS & BOISSONS ALCOOLISÉES</h2>
            <p>
              En vertu de l’article L. 3342-1 du Code de la santé publique, la vente de boissons alcoolisées à des mineurs de moins de dix-huit (18) ans
              est formellement interdite. L'acheteur certifie sur l'honneur avoir l'âge légal lors de la passation de commande.
              Une pièce d’identité peut être exigée par le livreur lors de la remise de la marchandise.
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="btn-pill btn-pill-outline text-xs">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
