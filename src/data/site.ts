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
 * WhatsApp destination. Production number supplied by the stakeholder
 * (2026-11-11). `wa.me` requires digits only, so the display-formatted
 * `WHATSAPP_NUMBER` is normalised before use. The retired obvious placeholder
 * (`#whatsapp-pendiente` / `+54 9 2304 000000`, docs/DESIGN.md §17.4) must
 * never ship again — `src/lib/whatsapp.ts` keeps it as a frozen guard so a
 * stale frontmatter value can never resolve to a stranger's number (R11).
 */
export const WHATSAPP_URL = 'https://wa.me/5493424727748';

/**
 * Display label for the production WhatsApp number, rendered in the footer
 * contact block. Santa Fe city grouping, matching the canonical per-listing
 * frontmatter form (`+54 9 342 4727748`).
 */
export const WHATSAPP_NUMBER = '+54 9 342 4727748';

/**
 * Contact hours. Taken verbatim from the validated visual references
 * (design/screens/01-landing-desktop.html, 02-landing-mobile.html).
 * Confirmed by the stakeholder (2026-11-11): Monday to Friday, 9 to 18.
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
 * Production matrícula supplied by the stakeholder (2026-11-11): `CCI 677`.
 * The contract (`docs/DESIGN.md:342`) keeps `CCI 000` as its pre-launch
 * placeholder; the site carries the production value. Never invent one.
 */
export const LEGAL_LINES: readonly string[] = [
  'Todas las propiedades exhibidas tienen el permiso firmado de los titulares para su difusión y promoción.',
  'Damero Propiedades funciona bajo la coordinación del Corredor Inmobiliario Luis Alejandro Da Silva — CCI 677.',
];
