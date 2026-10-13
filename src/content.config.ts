/**
 * Content collections — property listings (PRD §4 field contract).
 *
 * Astro 7 content layer: collections are declared in `src/content.config.ts`,
 * each with a `loader` (here the `glob` loader over local Markdown) and a Zod
 * `schema` that validates every entry's frontmatter.
 *
 * @see https://docs.astro.build/en/guides/content-collections/
 */
import { defineCollection } from 'astro:content';
import { glob, type Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import { existsSync } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const propertyFiles = glob({ base: './src/content/propiedades', pattern: '**/*.md' });
const uniquePropertySlugs: Loader = {
  name: propertyFiles.name,
  async load(context) {
    const filesById = new Map<string, string>();
    const root = fileURLToPath(context.config.root);
    await propertyFiles.load({
      ...context,
      store: {
        ...context.store,
        // Always validate file ownership, even for identical cached Markdown.
        get<TData extends Record<string, unknown>>(id: string) {
          const cached = context.store.get<TData>(id);
          return cached && { ...cached, digest: undefined };
        },
      },
      parseData(options) {
        const { id, filePath } = options;
        if (filePath) {
          const previous = filesById.get(id);
          if (previous && previous !== filePath && existsSync(previous)) {
            throw new Error(
              `Duplicate property slug "${id}": ${relative(root, previous)} and ${relative(root, filePath)}.`,
            );
          }
          // Release a file's old ID when its slug changes during development.
          for (const [claimedId, claimedFile] of filesById) {
            if (claimedFile === filePath && claimedId !== id) filesById.delete(claimedId);
          }
          // Reserve before awaiting schema parsing: glob loads files concurrently.
          filesById.set(id, filePath);
        }
        return context.parseData(options);
      },
    });
  },
};

const propiedades = defineCollection({
  loader: uniquePropertySlugs,
  schema: z
    .object({
      /** Listing headline (PRD §4). */
      titulo: z.string(),
      /** Short summary rendered above the free-text body on the detail page (PRD §4, §6). */
      descripcion: z.string(),
      /** URL-safe, unique across the collection (PRD §4). */
      slug: z.string(),
      /** Filterable operation (PRD §4, §5). */
      operacion: z.enum(['venta', 'alquiler']),
      /** Filterable, extensible property type, e.g. `casa`, `departamento`, `lote` (PRD §4). */
      tipo: z.string(),
      /** Numeric price, always paired with `moneda` (PRD §4). */
      precio: z.number(),
      /** Currency code; never rendered as a bare `$` (PRD §4, DESIGN §3, §16). */
      moneda: z.enum(['USD', 'ARS']),
      /** Monthly expenses; only where applicable (PRD §4). */
      expensas: z.number().nullable().optional(),
      /** Filterable room count (PRD §4, §5). */
      habitaciones: z.number(),
      /** Filterable: `true`/`false`, or an explicit count (PRD §4). */
      cochera: z.union([z.boolean(), z.number()]),
      /** Feature slugs, e.g. `pileta`, `parrilla` (PRD §4). */
      caracteristicas: z.array(z.string()),
      /** Free-text, rural-aware zone (PRD §4, §11). */
      zona: z.string(),
      /** Structured locality, kept for filtering (PRD §4, §11). */
      localidad: z.string(),
      /** Exact property location (`map_lat`/`map_lon`); never rendered as a number in HTML (PRD §4, §6, §11). */
      map_lat: z.number(),
      map_lon: z.number(),
      /** Per-listing agent number, not hardcoded in code (PRD §4, §11). */
      whatsapp: z.string(),
      /** Photos, max 10 per listing; the cover is the first entry (PRD §4, §7). */
      fotos: z.array(
        z
          .object({
            /** Path under `public/propiedades/<slug>/` (PRD §7). */
            src: z.string(),
            /** Optional caption shown under the image (PRD §4, §7). */
            titulo: z.string().optional(),
            /** Optional longer caption (PRD §4). */
            descripcion: z.string().optional(),
          })
          .strict(),
      ),
      /** Feeds the landing featured block; defaults to `false` (PRD §4). */
      destacada: z.boolean().default(false),
    })
    .strict(),
});

export const collections = { propiedades };
