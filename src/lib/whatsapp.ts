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
 * R11: a `wa.me` URL never ships pointing at the retired placeholder. Now
 * that the stakeholder has supplied the production number, listings whose
 * frontmatter is absent or still carries the old obvious placeholder fall
 * back to the site-level production link (`WHATSAPP_URL`) instead of an
 * inert anchor — because the placeholder could resolve to a stranger's
 * number. Activating every CTA is then a content change, not a code change.
 */
import { WHATSAPP_URL } from '../data/site';

/**
 * Retired obvious placeholder (docs/DESIGN.md §17.4), digits-normalised the
 * same way real numbers are. Frozen here — never derived from site data — so
 * a stale frontmatter value resolves to the site link, never to a stranger's
 * number.
 */
const RETIRED_PLACEHOLDER_DIGITS = '5492304000000';

/**
 * Build the PRD §6 deep-link for a real, already verified number.
 * Never call this with the retired placeholder — use `resolveWhatsAppHref`.
 */
export function buildWhatsAppUrl(whatsapp: string, titulo: string, slug: string): string {
  const digits = whatsapp.replace(/\D/g, '');
  const text = encodeURIComponent(`Hola Damero, me interesa ${titulo} (${slug})`);
  return `https://wa.me/${digits}?text=${text}`;
}

/**
 * Resolve the href a CTA should render. Returns the per-listing `wa.me`
 * deep-link for a real number, otherwise the site-level production link.
 *
 * `titulo`/`slug` default to empty because a fallback href carries no
 * prefilled message; the per-listing context is wired by the detail page
 * (S3) when it renders the CTA for a specific property.
 */
export function resolveWhatsAppHref(
  whatsapp: string | undefined,
  titulo = '',
  slug = '',
): string {
  if (!whatsapp) return WHATSAPP_URL;
  const digits = whatsapp.replace(/\D/g, '');
  if (digits === '' || digits === RETIRED_PLACEHOLDER_DIGITS) return WHATSAPP_URL;
  return buildWhatsAppUrl(digits, titulo, slug);
}
