/**
 * FAQ data — `/faqs` (ODD §17 slice S4, ruling R7).
 *
 * The six questions are the exact, in-order Spanish translation of the PRD §8
 * seed questions — verified 1:1 against the validated screens
 * (`design/screens/07-faqs-desktop.html`, `08-faqs-mobile.html`); they are not
 * a Stitch invention. The answers are stakeholder-owned and a launch blocker
 * (PRD §8): until they exist, every entry renders the docs/DESIGN.md §17.3
 * pending state — the explicit marker plus a neutral meta line — and never an
 * invented answer (§17.3:729, §11).
 *
 * R7 records the deliberate deviation from PRD §8:110 (`src/data/faqs.json`):
 * the rest of the data layer is typed TS, so the source is `faqs.ts`.
 *
 * The landing's FAQ teaser derives its questions from this module so the two
 * surfaces can never drift (R7 handoff).
 */

export interface FaqEntry {
  /** Question in Spanish, verbatim, in the PRD §8 order. */
  question: string;
  /**
   * Stakeholder-owned answer (PRD §8). While absent, the entry renders the
   * §17.3 pending state. Never fill this with invented content: no legal,
   * notarial, credit, tax or tenancy statement may be written by an agent
   * (§17.3:729).
   */
  answer?: string;
}

/** §17.3:727 pending marker — explicit, never a plausible-looking answer. */
export const FAQ_PENDING_MARKER = 'PENDIENTE';

/**
 * §17.3:728 neutral meta line: states the scope (the question's topic) and
 * the expected length (a brief paragraph) of the answer still to be written.
 * It carries no advice of any kind.
 */
export const FAQ_PENDING_META =
  'Respuesta en preparación: va a cubrir el tema de esta consulta en un párrafo breve.';

export const FAQ_ENTRIES: readonly FaqEntry[] = [
  { question: '¿Qué necesito para publicar mi propiedad en venta?' },
  { question: '¿Qué necesito para publicar mi propiedad en alquiler?' },
  { question: '¿Qué requisitos tiene una publicación apta crédito?' },
  { question: '¿Puedo vender sin título único?' },
  { question: 'Quiero comprar — ¿cómo me guían?' },
  { question: '¿Qué necesito para alquilar una propiedad?' },
];

/** Page head copy — verbatim from the validated screens. */
export const FAQ_PAGE = {
  eyebrow: 'PREGUNTAS FRECUENTES',
  title: 'Preguntas frecuentes',
  subhead:
    'Reunimos las consultas más habituales sobre publicar, comprar y alquilar con Damero. Si no encontrás tu respuesta, escribinos por WhatsApp.',
} as const;

/**
 * Side rail (desktop) / closing band (mobile) copy — verbatim from the
 * screens. §17.3:722-723: the page's single primary CTA lives here. The CTA
 * label itself comes from `WhatsAppCta`; the hours come from
 * `CONTACT_HOURS` in `site.ts` so every surface shows the same string.
 */
export const FAQ_CONTACT = {
  eyebrow: 'SEGUIMOS EN CONTACTO',
  heading: 'Si tu consulta no está acá, escribinos.',
  body: 'Te respondemos por WhatsApp en horario de atención.',
} as const;

/**
 * Full-width text link closing the desktop layout (the screens' bottom
 * hairline row; the mobile screen omits it, so it renders ≥ md only). The
 * literal `→` is the only arrow affordance §6 permits inside a text link.
 */
export const FAQ_MORE_LINK = {
  label: 'Ver todas las propiedades →',
  href: '/propiedades',
} as const;
