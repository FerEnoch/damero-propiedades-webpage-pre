/**
 * Detail-page map — docs/DESIGN.md §17.2:701-710, ODD §17 ruling R3.
 *
 * This module is imported EXCLUSIVELY through a dynamic `import()` from the
 * detail page's plain script, so `maplibre-gl` (~294 KB gzip JS per R3's
 * measurement) never enters the initial bundle of any page. The `client:*`
 * island directives do not apply: this project has no UI framework.
 *
 * Contract points enforced here:
 *  - Basemap: OpenFreeMap style URL (§17.2:703). The `positron` variant is
 *    the lowest-chroma OpenFreeMap style — the quietest field for the single
 *    brand overlay. No API key is required by the provider.
 *  - Exactly one overlay: a translucent circle of FIXED 400 m radius centred
 *    on the offset zone centre. No pin, no marker, no dot, no label
 *    (§17.2:704-705).
 *  - Interaction: `scrollZoom: false`, `dragRotate: false`,
 *    `touchZoomRotate` enabled, `cooperativeGestures` on desktop so the page
 *    still scrolls (§17.2:706).
 *  - Attribution is mandatory and permanent (§17.2:707): MapLibre's
 *    attribution control is configured `compact: false` so it is never
 *    collapsed behind a disclosure. The page styles the chip; removing or
 *    hiding it is a defect, not a styling choice.
 */
// v6 is ESM-only with named exports — there is no default export.
import { Map as MapLibreMap } from 'maplibre-gl';
/*
 * The stylesheet arrives as an emitted-asset URL and is injected at map
 * init. A plain side-effect `import 'maplibre-gl/dist/maplibre-gl.css'`
 * would be hoisted by Astro into the page's initial HTML — 83 KB of map
 * chrome CSS in the initial bundle, which R3 forbids.
 */
import maplibreCssUrl from 'maplibre-gl/dist/maplibre-gl.css?url';

let stylesInjected = false;

/** Inject the MapLibre chrome stylesheet exactly once, at map init. */
function ensureMapStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = maplibreCssUrl;
  document.head.appendChild(link);
}

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

/** Fixed privacy radius in meters (§17.2:704) — never rendered as text. */
const ZONE_RADIUS_M = 400;

/**
 * Meter-true circle as a GeoJSON polygon ring. MapLibre's native `circle`
 * layer is pixel-sized, so the 400 m radius is projected with the spherical
 * destination formula instead (64 vertices read as a circle at map scale).
 */
function zoneRing(lon: number, lat: number, radiusM: number, steps = 64): number[][] {
  const EARTH_RADIUS_M = 6371000;
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  const angular = radiusM / EARTH_RADIUS_M;
  const ring: number[][] = [];
  for (let i = 0; i <= steps; i += 1) {
    const bearing = (i / steps) * 2 * Math.PI;
    const pointLat = Math.asin(
      Math.sin(latRad) * Math.cos(angular) +
        Math.cos(latRad) * Math.sin(angular) * Math.cos(bearing),
    );
    const pointLon =
      lonRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angular) * Math.cos(latRad),
        Math.cos(angular) - Math.sin(latRad) * Math.sin(pointLat),
      );
    ring.push([(pointLon * 180) / Math.PI, (pointLat * 180) / Math.PI]);
  }
  return ring;
}

export interface DetailMapOptions {
  /** Positioned container inside the §17.2:702 frame (absolute, inset 0). */
  container: HTMLElement;
  /** Zone centre from the build-emitted JSON payload — never from the HTML. */
  lat: number;
  lon: number;
  /** The style loaded and the overlay is drawn — reveal the canvas. */
  onReady: () => void;
  /** The style failed to load — the caller keeps the §17.2:709 fallback. */
  onError: () => void;
}

export function initDetailMap({ container, lat, lon, onReady, onError }: DetailMapOptions): void {
  /*
   * The overlay colour reads the token at runtime (§13: raw palette values
   * stay in the token layer). If the token is unavailable the mandated
   * overlay cannot be drawn, so the map degrades to the fallback instead of
   * shipping a literal hex.
   */
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-graphic-accent')
    .trim();
  if (!accent) {
    onError();
    return;
  }

  const map = new MapLibreMap({
    container,
    style: STYLE_URL,
    center: [lon, lat],
    zoom: 14.5,
    scrollZoom: false,
    dragRotate: false,
    touchZoomRotate: true,
    cooperativeGestures: window.matchMedia('(min-width: 768px)').matches,
    attributionControl: { compact: false },
  });

  let settled = false;

  map.on('load', () => {
    if (settled) return;
    settled = true;
    map.addSource('zone', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [zoneRing(lon, lat, ZONE_RADIUS_M)] },
      },
    });
    map.addLayer({
      id: 'zone-fill',
      type: 'fill',
      source: 'zone',
      paint: { 'fill-color': accent, 'fill-opacity': 0.15 },
    });
    map.addLayer({
      id: 'zone-outline',
      type: 'line',
      source: 'zone',
      paint: { 'line-color': accent, 'line-opacity': 0.45, 'line-width': 1 },
    });
    onReady();
  });

  map.on('error', () => {
    if (settled) return;
    settled = true;
    // Tear down the partially initialised map so `Reintentar` starts clean.
    map.remove();
    onError();
  });
}
