/**
 * Per-listing map payload — docs/DESIGN.md §17.2:705, PRD §9 check 3.
 *
 * The map centre (`map_lat`/`map_lon`, already offset >=100 m at authoring)
 * must never appear in rendered HTML, metadata or JSON-LD — not even inline
 * in the markup source. Instead, each detail route gets this build-emitted
 * JSON asset at `/propiedades/<slug>.json`, which the page's plain script
 * fetches only when the map is actually initialised. A grep over
 * `dist/**\/*.html` therefore finds no coordinate; the numbers live in a
 * separate, explicit asset.
 *
 * The keys are deliberately short (`lat`/`lon`): the schema field names
 * (`map_lat`/`map_lon`) are part of the banned marker set in the e2e gate.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';

export const getStaticPaths: GetStaticPaths = async () => {
  const propiedades = await getCollection('propiedades');
  return propiedades.map((entry) => ({
    params: { slug: entry.data.slug },
    props: { lat: entry.data.map_lat, lon: entry.data.map_lon },
  }));
};

interface MapPayload {
  lat: number;
  lon: number;
}

export const GET: APIRoute = ({ props }) => {
  const { lat, lon } = props as MapPayload;
  return new Response(JSON.stringify({ lat, lon } satisfies MapPayload), {
    headers: { 'Content-Type': 'application/json' },
  });
};
