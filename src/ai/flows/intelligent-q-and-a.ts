'use server';

/**
 * @fileOverview An intelligent question and answer AI agent specialized in Iranian gardens.
 *
 * - intelligentQandA - A function that handles the question and answer process.
 * - IntelligentQandAInput - The input type for the intelligentQandA function.
 * - IntelligentQandAOutput - The return type for the intelligentQandA function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const DocumentSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  url: z.string(),
});

const IntelligentQandAInputSchema = z.object({
  question: z.string().describe('The question to be answered. This may be a standard question or a geospatial query in the format "Find gardens and related historical articles within a ... radius of latitude [lat], longitude [lon]".'),
  selectedSources: z.array(z.string()).describe('The data sources selected by the user.'),
  documents: z.array(DocumentSchema).describe('The existing documents in the session.'),
  language: z.enum(['en', 'fa']).describe('The language for the response.'),
});
export type IntelligentQandAInput = z.infer<typeof IntelligentQandAInputSchema>;

const IntelligentQandAOutputSchema = z.object({
  answer: z.string().describe('The synthesized answer to the question. Citations should be in the format [doc1], [doc2], etc. If you search online, you do not need to cite new documents.'),
  documents: z.array(z.object({
    title: z.string(),
    content: z.string(),
    url: z.string(),
  })).optional().describe("Newly found documents if online search was performed. You should populate this with the title, a detailed summary of the content including key facts, dates, and names, consisting of several paragraphs, and the URL of each source you used."),
  debugLog: z.string().optional().describe('A log of debug messages from the flow execution.'),
});
export type IntelligentQandAOutput = z.infer<typeof IntelligentQandAOutputSchema>;

async function callWithRetry<T>(fn: () => Promise<T>, log: (message: string) => void, maxRetries = 3, delay = 1000): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.message.includes('503') && i < maxRetries - 1) {
        const waitTime = delay * Math.pow(2, i);
        log(`[DEBUG] callWithRetry: Service unavailable (503). Retrying in ${waitTime}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
  // This line should not be reachable if the loop is configured correctly,
  // as the last error will be thrown. But to satisfy TypeScript:
  throw new Error('callWithRetry failed after all retries.');
}


async function performSearch(prompt: string, log: (message: string) => void): Promise<IntelligentQandAOutput | null> {
    try {
        const generateFn = () => ai.generate({
            prompt: prompt,
            model: 'googleai/gemini-flash-latest',
            output: {
                schema: IntelligentQandAOutputSchema,
                format: 'json',
            },
        });
        
        const { output } = await callWithRetry(generateFn, log);

        log('[DEBUG] performSearch: Received output from LLM:' + JSON.stringify(output, null, 2));

        if (!output) {
            throw new Error("LLM returned a null or undefined output.");
        }
        return output;
    } catch (e: any) {
        log(`[DEBUG] performSearch: FATAL ERROR - ai.generate call failed: ${e.message}\n${e.stack}`);
        throw e;
    }
}


export async function intelligentQandA(input: IntelligentQandAInput): Promise<IntelligentQandAOutput> {
  const logs: string[] = [];
  const log = (message: string) => logs.push(message);

  log('[DEBUG] intelligentQandA: Received input:' + JSON.stringify(input, null, 2));
  
  const { question, selectedSources, documents, language } = input;
  
  let finalAnswer = '';
  let finalDocuments: IntelligentQandAOutput['documents'] = [];

  try {
      const prompt = buildPrompt(question, selectedSources, documents, language);
      log('[DEBUG] intelligentQandA: Sending prompt to LLM.');
      
      const result = await performSearch(prompt, log);
      
      if (result) {
          finalAnswer = result.answer;
          finalDocuments = result.documents;
      } else {
           finalAnswer = language === 'fa' ? "متاسفانه نتوانستم پاسخی تولید کنم." : "I was unable to generate a response.";
      }

      const newDocuments = finalDocuments?.map(d => ({
          title: d.title,
          content: d.content,
          url: d.url,
      })) || [];
      
      return {
          answer: finalAnswer,
          documents: newDocuments,
          debugLog: logs.join('\n'),
      };

  } catch(e: any) {
    log(`[DEBUG] intelligentQandA: FATAL ERROR during flow execution: ${e.message}\n${e.stack}`);
    
    let userFriendlyError = "I am sorry, but an unexpected error occurred while trying to generate a response. Please check the logs for more details.";
    if (e.message.includes('503') || e.message.includes('overloaded')) {
      userFriendlyError = language === 'fa' 
        ? "سرویس هوش مصنوعی در حال حاضر مشغول است. لطفاً لحظاتی دیگر دوباره امتحان کنید."
        : "The AI service is temporarily busy. Please try again in a moment.";
    }

    return {
      answer: userFriendlyError,
      documents: [],
      debugLog: logs.join('\n'),
    };
  }
}


function buildPrompt(question: string, selectedSources: string[], documents: Document[], language: 'en' | 'fa'): string {
  const langInstruction = language === 'fa' 
    ? "You MUST provide your final answer, and all generated document titles and content, exclusively in the Persian (Farsi) language."
    : "You MUST provide your final answer, and all generated document titles and content, exclusively in the English language.";
  
  let prompt = `You are a specialized research assistant for Iranian gardens. Your purpose is to answer questions based on the provided context of existing documents. Your response MUST be in the requested language.

${langInstruction}

First, you MUST correct any spelling or grammatical mistakes in the user's question to improve clarity. Then, use the corrected question to formulate your answer.

You must decline to answer any question that is not directly related to Iranian gardens or the provided context.

When synthesizing your answer from the provided documents, you MUST cite them. Citations should be in the format [doc1], [doc2], etc., where the number corresponds to the document's ID.

If the context is empty or irrelevant, state that you cannot answer the question.

User's Question: "${question}"

Document Context:
${documents.map(doc => `[doc${doc.id}]: Title: ${doc.title}, Content: ${doc.content}`).join('\n')}
`;

  if (selectedSources.includes('Online Sources')) {
    prompt += `
The user has also requested an online search. You MUST search the internet for relevant, up-to-date information to answer the user's corrected question. Prioritize academic sources, historical archives, and encyclopedia entries to ensure the data is realistic and professional.

If the user's question is a geospatial query (e.g., "Find gardens... within a ... radius..."), you MUST use your search tools. MOST IMPORTANTLY: you must use the provided latitude and longitude as the primary and definitive center point for your search. Do not infer the location from any other text. Find locations matching those coordinates and then identify relevant gardens and historical information in that geographic area.

IMPORTANT: Your search must be highly specific to the user's query. For example, if the user asks for gardens in "Tehran", you MUST only use search results about Tehran. If your search returns information about other locations like Shiraz or Kashan, you MUST ignore it. If you cannot find any relevant information for the specific topic or location requested, you MUST state that you could not find anything and do not provide an answer based on irrelevant results.

After your search, synthesize a comprehensive answer that combines information from your search with the provided document context above.

For any NEW documents you find online and use in your answer, you MUST populate the 'documents' field in the JSON output. For each new document, provide a title, a detailed summary of the content including key facts, dates, and names, consisting of several paragraphs, and its URL. Remember to provide this generated content in the requested language. You do not need to add markdown citations for these new online sources in the 'answer' field.
`;
  } else {
    prompt += `
Synthesize a comprehensive answer based only on the document context provided and provide citations. Do not search online.
`;
  }
  return prompt;
}
