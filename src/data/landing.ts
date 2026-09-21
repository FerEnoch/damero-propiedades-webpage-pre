/**
 * Landing page copy — Damero Propiedades.
 *
 * Every user-facing string in this module is taken verbatim from the validated
 * visual references (`design/screens/01-landing-desktop.html` and
 * `design/screens/02-landing-mobile.html`). Long copy lives here so the page
 * template stays a composition, not a wall of Spanish (ODD T5, deliverable 2).
 *
 * Pending stakeholder values never become plausible-looking inventions
 * (docs/DESIGN.md §11, §16, §17.4): where the screens carried filler
 * placeholder text, the landing renders an explicit `PENDIENTE` marker and no
 * answer body.
 */
import { FAQ_ENTRIES, FAQ_PENDING_MARKER } from './faqs';

/**
 * The eight duotone glyph filenames from `src/icons/services/`
 * (docs/DESIGN.md §8). Duplicated as a union so `landing.ts` does not depend
 * on an Astro component's internal map.
 */
export type ServiceIconName =
  | 'icon-appraisal'
  | 'icon-megaphone'
  | 'icon-handshake'
  | 'icon-pen-seal'
  | 'icon-documents'
  | 'icon-keys'
  | 'icon-camera'
  | 'icon-target';

export interface LandingService {
  /** Service name in the screens' order (copy fixed, §16). */
  name: string;
  /** One-line description in the screens' order (copy fixed, §16). */
  description: string;
  /** Icon filename without extension, from `src/icons/services/`. */
  icon: ServiceIconName;
}

export interface LandingLink {
  label: string;
  href: string;
}

/** Hero — §5: eyebrow → display-xl headline (the page's single `h1`) → subhead → one primary CTA. */
export const HERO = {
  eyebrow: 'DAMERO PROPIEDADES',
  headline:
    'Somos Damero Propiedades y resolvemos cada etapa para que vendas, compres o alquiles con tranquilidad.',
  subhead:
    'Tenés dudas y no sabés cómo encarar tu negocio? Podés resolver tu inquietud en nuestra sección de preguntas frecuentes o consultarnos sin compromiso en nuestros canales de contacto.',
  cta: {
    label: 'Ver cartera de propiedades',
    // The landing's single primary action is a search action (§6). It points at
    // the search route; the screens' in-page anchors are superseded by the real
    // route contract in `src/data/site.ts`.
    href: '/propiedades',
  } satisfies LandingLink,
} as const;

/** Destacadas — §5: eyebrow + display-lg + "Ver todas las propiedades →" text link (right-aligned on desktop). */
export const FEATURED = {
  eyebrow: 'SELECCIÓN',
  heading: 'Propiedades destacadas',
  link: {
    label: 'Ver todas las propiedades →',
    href: '/propiedades',
  } satisfies LandingLink,
  /** §5 composition: one lead card + two compact cards. */
  leadCount: 1,
  compactCount: 2,
} as const;

/** Servicios — §5, §8: 2-column hairline index list of the eight fixed services. */
export const SERVICES: {
  eyebrow: string;
  heading: string;
  items: readonly LandingService[];
} = {
  eyebrow: 'QUÉ HACEMOS',
  heading: 'Nuestros servicios',
  items: [
    {
      name: 'Tasación',
      description: 'Valoramos tu inmueble con precisión y conocimiento del mercado.',
      icon: 'icon-appraisal',
    },
    {
      name: 'Comercialización',
      description: 'Promocionamos tu inmueble en los mejores canales para lograr la mejor venta.',
      icon: 'icon-megaphone',
    },
    {
      name: 'Negociación',
      description: 'Te acompañamos en todo el proceso para lograr las mejores condiciones.',
      icon: 'icon-handshake',
    },
    {
      name: 'Asesoramiento legal',
      description: 'Brindamos asesoramiento legal integral para garantizar operaciones seguras.',
      icon: 'icon-pen-seal',
    },
    {
      name: 'Gestión documental',
      description:
        'Nos ocupamos de toda la documentación para que no tengas que preocuparte por nada.',
      icon: 'icon-documents',
    },
    {
      name: 'Alquileres',
      description:
        'Administramos tu alquiler de forma profesional, cuidando tu propiedad y asegurando tranquilidad.',
      icon: 'icon-keys',
    },
    {
      name: 'Fotografía profesional',
      description: 'Mostramos tu inmueble con imágenes de calidad que enamoran.',
      icon: 'icon-camera',
    },
    {
      name: 'Marketing inmobiliario',
      description: 'Estrategias de marketing digital para llegar al público adecuado.',
      icon: 'icon-target',
    },
  ],
};

/**
 * FAQ teaser — the §5 list omits it, but the screens show it and the track's
 * task list includes it. Answers are stakeholder-owned (PRD §8, `[PENDIENTE]`)
 * and the screens fill them with filler placeholder copy; that must not ship
 * (§11). Only the seed questions render, each with an explicit pending marker
 * and *no* answer body — inventing one would be worse than an obvious gap
 * (§17.3).
 *
 * The questions and the marker derive from `src/data/faqs.ts` (ODD §17 ruling
 * R7) so the teaser and the `/faqs` page can never drift apart.
 */
export const FAQ_TEASER = {
  eyebrow: 'CONSULTAS HABITUALES',
  heading: 'Preguntas frecuentes',
  link: {
    label: 'Ver todas las preguntas frecuentes →',
    href: '/faqs',
  } satisfies LandingLink,
  /** §17.3 pending-content marker: explicit, never an invented answer. */
  pendingMarker: FAQ_PENDING_MARKER,
  /** At most two or three questions on the landing; the screens carry two. */
  questions: FAQ_ENTRIES.slice(0, 2).map((entry) => entry.question),
} as const;
