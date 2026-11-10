/**
 * ══════════════════════════════════════════════════════════════════════
 * ELEVEN SHOP — Réglementation Vente d'Alcool (Code de la santé publique)
 * ══════════════════════════════════════════════════════════════════════
 * 1. Interdiction de vente / livraison à emporter entre 22h00 et 06h00 (Art. L. 3322-9)
 * 2. Interdiction de vente aux mineurs (18+) & contrôle de la pièce d'identité originale (Art. L. 3342-1)
 */

export interface AlcoholCheckableItem {
  id?: string;
  name?: string;
  slug?: string;
  category_id?: string;
  categoryId?: string;
  isAgeRestricted?: boolean;
  is_age_restricted?: boolean;
  isAlcohol?: boolean;
}

/**
 * Détecte si un article est une boisson alcoolisée
 */
export function isAlcoholItem(item: AlcoholCheckableItem): boolean {
  if (item.isAlcohol === true) return true;
  if (item.category_id === 'cat-alcool' || item.categoryId === 'cat-alcool') return true;
  if (item.id && (item.id.startsWith('alcool-') || item.id.includes('-alcool-'))) return true;

  const combined = `${item.name || ''} ${item.slug || ''}`.toLowerCase();
  return /\b(bi[eè]re|bieres|bières|beer|beers|heineken|desperados|corona|vodka|vin|vins|whisky|whiskey|rhum|gin|tequila|champagne|liqueur|alcool|alcools)\b/i.test(
    combined
  );
}

/**
 * Retourne l'heure et la minute actuelles sur le fuseau horaire français (Europe/Paris)
 */
export function getParisTime(date: Date = new Date()): {
  hour: number;
  minute: number;
  formatted: string;
} {
  try {
    const parts = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);

    const hourPart = parts.find((p) => p.type === 'hour');
    const minPart = parts.find((p) => p.type === 'minute');

    const hour = hourPart ? parseInt(hourPart.value, 10) : date.getHours();
    const minute = minPart ? parseInt(minPart.value, 10) : date.getMinutes();

    const formatted = `${String(hour).padStart(2, '0')}h${String(minute).padStart(2, '0')}`;
    return { hour, minute, formatted };
  } catch {
    const hour = date.getHours();
    const minute = date.getMinutes();
    return {
      hour,
      minute,
      formatted: `${String(hour).padStart(2, '0')}h${String(minute).padStart(2, '0')}`,
    };
  }
}

/**
 * Détermine si le créneau d'interdiction de vente d'alcool (22h - 6h) est actif
 */
export function isAlcoholCurfewActive(date: Date = new Date()): boolean {
  const { hour } = getParisTime(date);
  return hour >= 22 || hour < 6;
}

export const ALCOHOL_LEGAL_NOTICES = {
  curfewTitle: 'Vente interdite entre 22h et 6h',
  curfewLaw: 'Art. L. 3322-9 du Code de la santé publique',
  curfewWarningActive:
    'Il est actuellement [HEURE]. Conformément à la législation française, la vente à emporter et la livraison de boissons alcoolisées sont strictement interdites entre 22h00 et 06h00. Vous devez retirer les boissons alcoolisées de votre panier pour pouvoir finaliser votre commande nocturne.',
  curfewNoticeInactive:
    'Réglementation nocturne : La vente et la livraison de boissons alcoolisées sont formellement interdites entre 22h00 et 06h00 (Art. L. 3322-9 CSP). Votre commande ne peut être livrée que sur les créneaux autorisés (06h00 - 22h00).',
  idCardTitle: 'Carte d’identité originale obligatoire',
  idCardLaw: 'Art. L. 3342-1 & L. 3342-3 du Code de la santé publique',
  idCardDescription:
    'La vente d’alcool est strictement interdite aux mineurs de moins de 18 ans. Une pièce d’identité officielle physique originale avec photo (Carte Nationale d’Identité, Passeport, Permis de conduire) vous sera obligatoirement demandée par notre livreur à la réception de votre commande. En l’absence de justificatif original valide ou en cas de minorité, les boissons alcoolisées ne pourront en aucun cas être remises.',
  checkboxLabel:
    'Je certifie sur l’honneur être majeur(e) (18 ans ou plus) et je m’engage à présenter ma pièce d’identité originale avec photo au livreur *',
};
