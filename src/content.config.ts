import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				// Shown in the right sidebar of a tool comparison page (see src/components/PageSidebar.astro).
				adoption: z
					.object({
						github: z.string(),
						npm: z.string().optional(),
						created: z.coerce.date(),
						requires: z.array(z.string()).optional(),
					})
					.optional(),
			}),
		}),
	}),
};
