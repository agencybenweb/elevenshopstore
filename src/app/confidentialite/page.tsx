import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité & RGPD — Eleven Shop Roanne',
  description: 'Engagement de protection des données personnelles et politique RGPD d’Eleven Shop.',
};

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen pt-28 pb-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <h1 className="font-display text-4xl tracking-wide text-white md:text-5xl mb-6">
          CONFIDENTIALITÉ & RGPD
        </h1>

        <div className="rounded-3xl border border-white/10 bg-surface-elevated p-6 md:p-10 space-y-8 text-sm text-white/80 leading-relaxed">
          <section>
            <h2 className="font-display text-xl text-primary mb-2">1. ENGAGEMENT DE CONFIDENTIALITÉ</h2>
            <p>
              Eleven Shop accorde une importance primordiale au respect de votre vie privée. Conformément au Règlement Général sur la Protection
              des Données (RGPD) et à la loi « Informatique et Libertés », nous limitons la collecte de données au strict nécessaire
              pour exécuter et acheminer votre livraison nocturne à Roanne.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-primary mb-2">2. DONNÉES COLLECTÉES</h2>
            <p>
              Lors de votre commande, les seules informations recueillies sont :
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-text-muted">
              <li>Votre nom complet (pour identifier la commande).</li>
              <li>Votre numéro de téléphone (pour vous appeler lors de la livraison ou en cas d'imprévu).</li>
              <li>Votre adresse physique, code postal et compléments (bâtiment, interphone, étage).</li>
              <li>Le détail de votre panier et le mode de paiement choisi.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-primary mb-2">3. ABSENCE DE TRACEURS ET PUBLICITÉS</h2>
            <p>
              Notre site web <strong>n'utilise aucun traceur publicitaire tiers</strong>, aucun cookie de profilage commercial
              et ne revend aucune de vos informations personnelles. Seul le stockage local technique (localStorage) est utilisé
              sur votre appareil pour mémoriser les articles de votre panier d'achat d'une visite à l'autre.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-primary mb-2">4. DESTINATAIRES DES DONNÉES</h2>
            <p>
              Les données de commande sont exclusivement transmises au gérant d'Eleven Shop et aux livreurs en service afin d'assurer
              la logistique de livraison via notre canal Telegram interne et sécurisé.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-primary mb-2">5. VOS DROITS D'ACCÈS ET SUPPRESSION</h2>
            <p>
              Vous disposez à tout moment d'un droit d'accès, de rectification et de suppression de vos données personnelles.
              Pour toute demande, vous pouvez nous contacter par simple e-mail à : <strong>contact@elevenshop.fr</strong>.
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
