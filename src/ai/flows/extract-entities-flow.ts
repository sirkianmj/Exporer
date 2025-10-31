'use server';
/**
 * @fileOverview An AI flow for extracting named entities from a collection of documents.
 * 
 * - extractEntities - A function that orchestrates the entity extraction process.
 * - ExtractEntitiesInput - The input type for the extractEntities function.
 * - ExtractEntitiesOutput - The return type for the extractEntities function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EntitySchema = z.object({
    name: z.string().describe('The name of the extracted entity (e.g., "Fin Garden", "Shah Abbas").'),
    type: z.enum(['Garden', 'Person', 'Dynasty', 'Location', 'Element', 'Concept', 'Date', 'باغ', 'شخص', 'سلسله', 'مکان', 'عنصر', 'مفهوم', 'تاریخ']).describe('The category of the entity.'),
    lat: z.number().optional().describe('The latitude of the location, if applicable.'),
    lon: z.number().optional().describe('The longitude of the location, if applicable.'),
});

const DocumentEntitiesSchema = z.object({
    docId: z.number().describe('The ID of the document from which entities were extracted.'),
    entities: z.array(EntitySchema).describe('A list of entities found in this document.'),
});

const ExtractEntitiesInputSchema = z.object({
    documents: z.array(
        z.object({
            id: z.number(),
            content: z.string(),
        })
    ),
    language: z.enum(['en', 'fa']),
});
export type ExtractEntitiesInput = z.infer<typeof ExtractEntitiesInputSchema>;

const ExtractEntitiesOutputSchema = z.array(DocumentEntitiesSchema);
export type ExtractEntitiesOutput = z.infer<typeof ExtractEntitiesOutputSchema>;

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.message.includes('503') && i < maxRetries - 1) {
        const waitTime = delay * Math.pow(2, i);
        console.log(`[DEBUG] callWithRetry (extractEntities): Service unavailable (503). Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      if (error.message.includes('429') && i < maxRetries - 1) {
        const waitTime = delay * Math.pow(2, i);
        console.log(`[DEBUG] callWithRetry (extractEntities): Rate limited (429). Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
  // This line should not be reachable if the loop is configured correctly.
  throw new Error('callWithRetry (extractEntities) failed after all retries.');
}


export async function extractEntities(input: ExtractEntitiesInput): Promise<ExtractEntitiesOutput> {
    if (!input.documents || input.documents.length === 0) {
        return [];
    }
    return extractEntitiesFlow(input);
}

const entityExtractionPrompt = ai.definePrompt({
    name: 'entityExtractionPrompt',
    input: { schema: ExtractEntitiesInputSchema },
    output: { schema: ExtractEntitiesOutputSchema },
    model: 'googleai/gemini-1.5-flash-latest',
    prompt: `You are an expert in history and cultural studies, specializing in Persian gardens. Your task is to extract key named entities from the following documents. The response MUST be in the specified language.

If the language is 'fa' (Persian), all extracted entity names and types MUST be in Persian.
If the language is 'en' (English), all extracted entity names and types MUST be in English.

Language: {{{language}}}

Analyze the content of each document and identify specific, named entities. Do not extract generic terms. For example, extract "Fin Garden" or "Shazdeh Garden", not just "garden". Extract "Shah Abbas", not just "shah".

For each document, provide a list of the entities you found. Categorize each entity into one of the following types based on the language:
- English Types: 'Garden', 'Person', 'Dynasty', 'Location', 'Element', 'Concept', 'Date'
- Persian Types: 'باغ', 'شخص', 'سلسله', 'مکان', 'عنصر', 'مفهوم', 'تاریخ'

IMPORTANT: For every entity of type 'Location' (or 'مکان'), you MUST also provide its geographic coordinates (latitude and longitude).

Focus on the most important and relevant entities that help understand the document's main points.

Documents to analyze:
{{{documents}}}

Return your response as a JSON array that matches the output schema.`,
});

const extractEntitiesFlow = ai.defineFlow(
    {
        name: 'extractEntitiesFlow',
        inputSchema: ExtractEntitiesInputSchema,
        outputSchema: ExtractEntitiesOutputSchema,
    },
    async (input) => {
        const generateFn = () => entityExtractionPrompt(input);
        const { output } = await callWithRetry(generateFn);
        return output || [];
    }
);
