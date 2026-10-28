import { z } from 'zod';
import { DEMO_SETTINGS } from '@/lib/demo-data';

// French phone number validation regex: accepts +33, 0033, 0 followed by 9 digits with optional spaces/dots/dashes
const frenchPhoneRegex = /^(?:(?:\+|00)33|0)[1-9](?:[\s.-]*\d{2}){4}$/;

export const orderFormSchema = z.object({
  client_name: z
    .string()
    .trim()
    .min(2, { message: 'Veuillez renseigner votre nom complet (au moins 2 caractères).' })
    .max(80, { message: 'Nom trop long.' }),

  client_phone: z
    .string()
    .trim()
    .regex(frenchPhoneRegex, {
      message: 'Numéro de téléphone français invalide (ex: 06 12 34 56 78).',
    }),

  address: z
    .string()
    .trim()
    .min(5, { message: 'Veuillez préciser le numéro et le nom de rue (ex: 12 rue de la Paix).' })
    .max(150, { message: 'Adresse trop longue.' }),

  postal_code: z
    .string()
    .trim()
    .length(5, { message: 'Le code postal doit comporter 5 chiffres.' }),

  city: z
    .string()
    .trim()
    .min(2, { message: 'Veuillez renseigner la ville (ex: Roanne).' })
    .max(50, { message: 'Nom de ville trop long.' }),

  address_extra: z
    .string()
    .trim()
    .max(150, { message: 'Complément trop long.' })
    .optional()
    .default(''),

  notes: z
    .string()
    .trim()
    .max(300, { message: 'Remarque trop longue.' })
    .optional()
    .default(''),

  payment_method: z.enum(['cash', 'card'], {
    message: 'Veuillez choisir un mode de paiement à la livraison.',
  }),

  is_adult_confirmed: z.boolean().optional().default(false),

  items: z
    .array(
      z.object({
        product_id: z.string().min(1),
        quantity: z.number().int().positive().max(50),
      })
    )
    .min(1, { message: 'Votre panier est vide.' }),

  // Anti-spam honeypot — must remain empty
  honeypot: z.string().max(0, { message: 'Bot detected' }).optional().default(''),
});

export type OrderFormInput = z.infer<typeof orderFormSchema>;

export function isPostalCodeAllowed(
  postalCode: string,
  allowedCodes: string[] = DEMO_SETTINGS.allowed_postal_codes
): boolean {
  return allowedCodes.includes(postalCode.trim());
}
