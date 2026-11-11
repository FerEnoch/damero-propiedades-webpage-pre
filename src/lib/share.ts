/** Client-built destinations: never infer an origin during the static build. */
export function buildShareLinks(title: string, text: string, url: string) {
  const message = `${text}${url}`;
  return {
    WhatsApp: `https://wa.me/?text=${encodeURIComponent(message)}`,
    Telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    Email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`,
  };
}

/** Secure clipboard first; legacy copy also works on non-secure HTTP origins. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator.clipboard?.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission rejection must still leave the legacy/manual paths available.
  }

  let textarea: HTMLTextAreaElement | undefined;
  let previousFocus: Element | null = null;
  let selection: Selection | null = null;
  let ranges: Range[] = [];
  try {
    previousFocus = document.activeElement;
    selection = window.getSelection();
    ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) =>
      selection!.getRangeAt(index).cloneRange()) : [];
    textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.readOnly = true;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.inset = '0';
    document.body.appendChild(textarea);
    textarea.select();
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    try {
      textarea?.remove();
      if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
      if (selection) {
        selection.removeAllRanges();
        ranges.forEach((range) => selection!.addRange(range));
      }
    } catch {
      // Restoration must never turn a completed copy into a caller exception.
    }
  }
}
