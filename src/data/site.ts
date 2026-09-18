/**
 * Site-level values — Damero Propiedades.
 *
 * A single module so every pending stakeholder value is replaced in exactly
 * one place. Values that have not been supplied yet are explicit, unmistakable
 * placeholders (`*_PENDING`) — never plausible-looking inventions
 * (docs/DESIGN.md §11, §16).
 */

/** Public site name. Used as the default document title and as the logo name. */
export const SITE_NAME = 'Damero Propiedades';

export interface NavRoute {
  label: string;
  href: string;
}

/**
 * Primary navigation. Order and labels are contractual (docs/DESIGN.md §6).
 * Both the header and the footer render from this list.
 */
export const NAV_ROUTES: readonly NavRoute[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Propiedades', href: '/propiedades' },
  { label: 'Preguntas frecuentes', href: '/faqs' },
];

/**
 * WhatsApp destination. Pending stakeholder value: the real number has not
 * been supplied (odd/tasks/damero-pages.md, "Pendientes del stakeholder").
 * The href is an inert placeholder anchor so the link stays keyboard-reachable
 * without shipping the screens' fabricated WhatsApp deep-link
 * (docs/DESIGN.md §17.4: no real WhatsApp link ships until the stakeholder
 * provides the number).
 */
export const WHATSAPP_URL_PENDING = '#whatsapp-pendiente';

/**
 * Placeholder label shown where the real WhatsApp number will go.
 *
 * Kept verbatim from the validated visual references
 * (design/screens/01-landing-desktop.html:416, 02-landing-mobile.html:347),
 * where it is the contract's designated obvious placeholder
 * (docs/DESIGN.md §17.4). PENDING: replace with the real number before launch.
 */
export const WHATSAPP_NUMBER_PENDING = '+54 9 2304 000000';

/**
 * Contact hours. Taken verbatim from the validated visual references
 * (design/screens/01-landing-desktop.html, 02-landing-mobile.html).
 * Confirm with the stakeholder before launch.
 */
export const CONTACT_HOURS = 'Lunes a viernes, 9 a 18 h';

/** Single brand line in the footer. Copied from the validated references. */
export const SITE_TAGLINE = 'Catálogo inmobiliario con respaldo jurídico.';

/**
 * The brand wordmark, split so the mobile lockup can drop the trailing word.
 * At 390px the full name plus the WhatsApp link plus the menu affordance does
 * not fit in the 64px header DESIGN.md §6 requires; `Damero` alone is also
 * exactly the wordmark carried by the real logo asset. Desktop renders both.
 */
export const BRAND_WORDMARK_LEAD = 'Damero';
export const BRAND_WORDMARK_TRAIL = 'Propiedades';

/** Heading above the footer nav routes. From the validated references. */
export const FOOTER_NAV_HEADING = 'Navegación';

/** Heading above the footer contact block. From the validated references. */
export const FOOTER_CONTACT_HEADING = 'WhatsApp';

/**
 * Fixed legal block — copied verbatim from docs/DESIGN.md §6. Never truncated,
 * never hidden behind a disclosure, never rendered below 13px.
 *
 * `CCI 000` is a placeholder written by the contract itself; it is kept exactly
 * as the contract writes it and flagged as pending. Do not invent a real number.
 */
export const LEGAL_LINES: readonly string[] = [
  'Todas las propiedades exhibidas tienen el permiso firmado de los titulares para su difusión y promoción.',
  'Damero Propiedades funciona bajo la coordinación del Corredor Inmobiliario Luis Alejandro Da Silva — CCI 000.',
];
