'use server';

import {genkit, Genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

let aiInstance: Genkit | null = null;

function getAiInstance() {
  if (!aiInstance) {
    if (!process.env.GEMINI_API_KEY) {
      // This will provide a clearer error if the key is still not found.
      throw new Error(
        'FATAL: GEMINI_API_KEY environment variable is not set.'
      );
    }
    aiInstance = genkit({
      plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
    });
  }
  return aiInstance;
}

// Use a proxy to lazily initialize the ai object.
export const ai = new Proxy<Genkit>({} as Genkit, {
  get: (target, prop, receiver) => {
    return Reflect.get(getAiInstance(), prop, receiver);
  },
});
