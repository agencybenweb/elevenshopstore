import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente (CGV) — Eleven Shop Roanne',
  description: 'Conditions générales de vente et de livraison nocturne d’Eleven Shop à Roanne.',
};

export default function CGVPage() {
  return (
    <div className="min-h-screen pt-28 pb-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <h1 className="font-display text-4xl tracking-wide text-white md:text-5xl mb-6">
          CONDITIONS GÉNÉRALES DE VENTE
        </h1>

        <div className="rounded-3xl border border-white/10 bg-surface-elevated p-6 md:p-10 space-y-8 text-sm text-white/80 leading-relaxed">
          <section>
            <h2 className="font-display text-xl text-primary mb-2">1. OBJET ET CHAMP D'APPLICATION</h2>
            <p>
              Les présentes Conditions Générales de Vente (CGV) régissent l'ensemble des commandes passées auprès de l'épicerie <strong>Eleven Shop</strong>
              via son site internet. Eleven Shop assure un service exclusif de livraison à domicile 24h/24 et 7j/7 sur la commune de Roanne (42300)
              et son agglomération proche. Aucun retrait sur place n’est proposé.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-primary mb-2">2. PRIX ET PRODUITS</h2>
            <p>
              Les prix de nos produits sont indiqués en Euros toutes taxes comprises (TTC). Les frais de livraison applicables sont clairement mentionnés
              avant la validation de la commande :
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-text-muted">
              <li>Minimum de commande obligatoire : 15,00 € TTC (hors frais de livraison).</li>
              <li>Frais de livraison standard : 3,00 € TTC.</li>
              <li>Livraison gratuite : offerte pour toute commande atteignant ou dépassant 30,00 € TTC.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-primary mb-2">3. PROCESSUS DE COMMANDE ET VALIDATION</h2>
            <p>
              Le client compose son panier, renseigne ses coordonnées téléphoniques et postales précises, puis confirme sa commande.
              Toute commande validée sur le site fait l'objet d'un récapitulatif avec code unique de suivi (ex : #ELV-XXXX) et est immédiatement
              transmise aux livreurs d'Eleven Shop via notre système Telegram sécurisé.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-primary mb-2">4. MODALITÉS DE PAIEMENT</h2>
            <p>
              Le paiement s'effectue <strong>exclusivement à la livraison</strong> lors de la remise de la marchandise par le livreur :
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-text-muted">
              <li>En espèces (le client est invité à préparer l'appoint dans la mesure du possible).</li>
              <li>Par carte bancaire (via terminal de paiement électronique sans contact sécurisé disponible auprès du livreur).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-primary mb-2">5. DÉLAIS ET CONDITIONS DE LIVRAISON</h2>
            <p>
              Les livraisons sont assurées dans les meilleurs délais à toute heure du jour et de la nuit. Le client s'engage à être joignable
              sur le numéro de téléphone renseigné afin de faciliter la remise de commande (interphone, accès hall, portail).
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
