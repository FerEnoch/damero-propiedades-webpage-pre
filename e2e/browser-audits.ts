/**
 * Browser-side audit helpers for the e2e suite (ODD task T7).
 *
 * Every exported function is deliberately SELF-CONTAINED: Playwright
 * serialises the function source and re-evaluates it inside the page, so
 * nothing here may reference module-scope or Node-scope identifiers. Shared
 * logic (colour parsing, contrast math, element description) is duplicated
 * inside each export on purpose.
 */

export interface MatrixProbe {
  /** Pair name from the docs/DESIGN.md §2 contrast matrix (failure messages). */
  name: string;
  /** Selector of a rendered element that represents the pair. */
  selector: string;
}

export interface SageTextViolation {
  element: string;
  text: string;
}

export interface ContrastViolation {
  element: string;
  text: string;
  ratio: number;
  threshold: number;
  foreground: string;
  background: string;
}

export interface MatrixMeasurement {
  name: string;
  ratio: number;
  threshold: number;
  foreground: string;
  background: string;
}

export interface ColorAuditResult {
  textElementsChecked: number;
  sageTextViolations: SageTextViolation[];
  contrastViolations: ContrastViolation[];
  matrix: MatrixMeasurement[];
}

/**
 * Single-pass colour audit over every element that renders visible text:
 *  - flags any element whose computed `color` is sage `#7C916F`
 *    (docs/DESIGN.md §2: sage is never rendered text);
 *  - measures the WCAG contrast ratio of every rendered text element against
 *    its effective background (ancestors are walked past transparent fills,
 *    translucent foregrounds are composited over that background);
 *  - measures the representative elements of the §2 contrast matrix.
 *
 * Thresholds: 4.5:1 for normal text, 3:1 for large text (>= 24px, or
 * >= 18.66px at weight >= 700).
 */
export function runColorAudits(matrixProbes: MatrixProbe[]): ColorAuditResult {
  const SAGE = { r: 124, g: 145, b: 111 };

  function parseColor(value: string) {
    if (!value || value === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    const match = value.match(/rgba?\(([^)]*)\)/);
    if (!match) return null;
    const parts = match[1]
      .replace(/\//g, ' ')
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }

  function formatColor(c: { r: number; g: number; b: number; a: number }) {
    return `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;
  }

  function luminance(c: { r: number; g: number; b: number }) {
    const channel = (v: number) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
  }

  function contrastRatio(
    a: { r: number; g: number; b: number },
    b: { r: number; g: number; b: number },
  ) {
    const la = luminance(a);
    const lb = luminance(b);
    const hi = Math.max(la, lb);
    const lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }

  function compositeOver(
    fg: { r: number; g: number; b: number; a: number },
    bg: { r: number; g: number; b: number; a: number },
  ) {
    const a = fg.a + bg.a * (1 - fg.a);
    if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
      g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
      b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
      a,
    };
  }

  /** First opaque fill walking up the ancestor chain, compositing translucents. */
  function effectiveBackground(el: Element) {
    const layers: Array<{ r: number; g: number; b: number; a: number }> = [];
    let node: Element | null = el;
    while (node) {
      const c = parseColor(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a === 1) break;
      }
      node = node.parentElement;
    }
    let base =
      layers.length > 0 && layers[layers.length - 1].a === 1
        ? layers.pop()!
        : { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) {
      base = compositeOver(layers[i], base);
    }
    return base;
  }

  function hasDirectText(el: Element) {
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE && (child.textContent || '').trim().length > 0) {
        return true;
      }
    }
    return false;
  }

  function isVisible(el: Element) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility !== 'visible') return false;
    if (parseFloat(style.opacity) === 0) return false;
    return el.getClientRects().length > 0;
  }

  function describe(el: Element) {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const cls =
      typeof el.className === 'string' && el.className.trim()
        ? `.${el.className.trim().split(/\s+/).join('.')}`
        : '';
    return `${tag}${id}${cls}`;
  }

  function sampleText(el: Element) {
    return (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  }

  function measure(el: Element) {
    const style = getComputedStyle(el);
    const fg = parseColor(style.color) || { r: 0, g: 0, b: 0, a: 1 };
    const bg = effectiveBackground(el);
    const flatFg = fg.a === 1 ? fg : compositeOver(fg, bg);
    const ratio = Math.round(contrastRatio(flatFg, bg) * 100) / 100;
    const fontSize = parseFloat(style.fontSize);
    const fontWeight = parseInt(style.fontWeight, 10) || 400;
    const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
    return {
      ratio,
      threshold: isLarge ? 3 : 4.5,
      foreground: style.color,
      background: formatColor(bg),
      fg,
    };
  }

  const result: ColorAuditResult = {
    textElementsChecked: 0,
    sageTextViolations: [],
    contrastViolations: [],
    matrix: [],
  };

  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);
  for (const el of Array.from(document.body.querySelectorAll('*'))) {
    if (SKIP_TAGS.has(el.tagName)) continue;
    if (!hasDirectText(el)) continue;
    if (!isVisible(el)) continue;
    result.textElementsChecked++;

    const m = measure(el);

    if (
      m.fg.a > 0 &&
      Math.round(m.fg.r) === SAGE.r &&
      Math.round(m.fg.g) === SAGE.g &&
      Math.round(m.fg.b) === SAGE.b
    ) {
      result.sageTextViolations.push({ element: describe(el), text: sampleText(el) });
    }

    if (m.ratio < m.threshold) {
      result.contrastViolations.push({
        element: describe(el),
        text: sampleText(el),
        ratio: m.ratio,
        threshold: m.threshold,
        foreground: m.foreground,
        background: m.background,
      });
    }
  }

  for (const probe of matrixProbes) {
    const el = document.querySelector(probe.selector);
    if (!el) {
      result.matrix.push({
        name: probe.name,
        ratio: 0,
        threshold: 4.5,
        foreground: 'element not found',
        background: probe.selector,
      });
      continue;
    }
    const m = measure(el);
    result.matrix.push({
      name: probe.name,
      ratio: m.ratio,
      threshold: m.threshold,
      foreground: m.foreground,
      background: m.background,
    });
  }

  return result;
}

export interface TouchTargetViolation {
  element: string;
  text: string;
  width: number;
  height: number;
}

/**
 * Every visible interactive element must meet the 44px touch-target minimum
 * (docs/DESIGN.md §12). Returns the elements that do not.
 */
export function auditTouchTargets(minSize: number): TouchTargetViolation[] {
  const selector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function isVisible(el: Element) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility !== 'visible') return false;
    return el.getClientRects().length > 0;
  }

  function describe(el: Element) {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const cls =
      typeof el.className === 'string' && el.className.trim()
        ? `.${el.className.trim().split(/\s+/).join('.')}`
        : '';
    return `${tag}${id}${cls}`;
  }

  const violations: TouchTargetViolation[] = [];
  for (const el of Array.from(document.querySelectorAll(selector))) {
    if (!isVisible(el)) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < minSize || rect.height < minSize) {
      violations.push({
        element: describe(el),
        text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
        width: Math.round(rect.width * 100) / 100,
        height: Math.round(rect.height * 100) / 100,
      });
    }
  }
  return violations;
}

/**
 * Collects every keyboard-reachable element in DOM order and stores it on
 * `window.__kbdExpected` for the per-Tab assertions that follow. Returns the
 * element count.
 */
export function prepareKeyboardAudit(): number {
  const selector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function isReachable(el: Element) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility !== 'visible') return false;
    return el.getClientRects().length > 0;
  }

  const elements = Array.from(document.querySelectorAll(selector)).filter(isReachable);
  (window as unknown as { __kbdExpected: Element[] }).__kbdExpected = elements;
  return elements.length;
}

export interface FocusedElementState {
  /** Index of document.activeElement within the expected DOM-order list (-1 = not in it). */
  index: number;
  label: string;
  outlineStyle: string;
  outlineWidth: string;
  outlineColor: string;
  outlineOffset: string;
}

/** Reads the currently focused element and its computed focus ring. */
export function readFocusedElement(): FocusedElementState {
  const expected =
    (window as unknown as { __kbdExpected?: Element[] }).__kbdExpected || [];
  const el = document.activeElement;
  const style = el ? getComputedStyle(el) : null;
  const cls =
    el && typeof (el as Element).className === 'string' && (el as Element).className.trim()
      ? `.${(el as Element).className.trim().split(/\s+/).join('.')}`
      : '';
  return {
    index: el ? expected.indexOf(el) : -1,
    label: el ? `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls}` : 'none',
    outlineStyle: style ? style.outlineStyle : 'none',
    outlineWidth: style ? style.outlineWidth : '0px',
    outlineColor: style ? style.outlineColor : 'none',
    outlineOffset: style ? style.outlineOffset : '0px',
  };
}
