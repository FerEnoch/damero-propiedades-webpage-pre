/**
 * WhatsApp deep-link helper — PRD §6, ODD §17 ruling R11.
 *
 * The contractual format is:
 *
 *   https://wa.me/<whatsapp>?text=Hola%20Damero%2C%20me%20interesa%20<titulo>%20(<slug>)
 *
 * with the per-listing agent number from the `whatsapp` frontmatter field and
 * the message carrying the listing title and slug. `wa.me` requires digits
 * only, so the display-formatted number is normalised before use.
 *
 * R11: the href stays INERT until the stakeholder supplies the real number.
 * While the frontmatter carries the pending placeholder (or nothing), the
 * resolver returns the same inert anchor the landing uses
 * (`WHATSAPP_URL_PENDING`) — a `wa.me` URL is never shipped pointing at the
 * placeholder, because it could resolve to a stranger's number. Activating
 * every CTA is then a content change, not a code change.
 */
import { WHATSAPP_NUMBER_PENDING, WHATSAPP_URL_PENDING } from '../data/site';

/** The pending placeholder, normalised the same way real numbers are. */
const PENDING_WHATSAPP_DIGITS = WHATSAPP_NUMBER_PENDING.replace(/\D/g, '');

/**
 * Build the PRD §6 deep-link for a real, already verified number.
 * Never call this with the pending placeholder — use `resolveWhatsAppHref`.
 */
export function buildWhatsAppUrl(whatsapp: string, titulo: string, slug: string): string {
  const digits = whatsapp.replace(/\D/g, '');
  const text = encodeURIComponent(`Hola Damero, me interesa ${titulo} (${slug})`);
  return `https://wa.me/${digits}?text=${text}`;
}

/**
 * Resolve the href a CTA should render. Returns the inert pending anchor
 * while the number is absent or still the stakeholder placeholder.
 *
 * `titulo`/`slug` default to empty because the href is inert anyway until the
 * real number exists; the per-listing context is wired by the detail page
 * (S3) when it renders the CTA for a specific property.
 */
export function resolveWhatsAppHref(
  whatsapp: string | undefined,
  titulo = '',
  slug = '',
): string {
  if (!whatsapp) return WHATSAPP_URL_PENDING;
  const digits = whatsapp.replace(/\D/g, '');
  if (digits === '' || digits === PENDING_WHATSAPP_DIGITS) return WHATSAPP_URL_PENDING;
  return buildWhatsAppUrl(digits, titulo, slug);
}
