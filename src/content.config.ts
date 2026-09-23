import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				// Adds a Full / Code only switch under the title (see src/components/PageTitle.astro).
				views: z.boolean().optional(),
				// What a tool is best for, shown in the right sidebar above Dependencies.
				useCases: z.array(z.string()).optional(),
				// What a tool needs beyond Node and npm, shown in the right sidebar.
				requires: z.array(z.string()).optional(),
				// Shown in the right sidebar of a tool comparison page (see src/components/PageSidebar.astro).
				adoption: z
					.object({
						github: z.string(),
						npm: z.string().optional(),
						created: z.coerce.date(),
					})
					.optional(),
			}),
		}),
	}),
};
