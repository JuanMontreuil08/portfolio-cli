import { GoogleGenerativeAI } from '@google/generative-ai';
import { type RepoData } from './github.js';

const API_KEY = process.env.GEMINI_API_KEY ?? '';

export async function* streamSummary(data: RepoData): AsyncGenerator<string> {
  if (!data.readme) {
    yield 'Not enough information in README.';
    return;
  }

  if (!API_KEY) throw new Error('GOOGLE_API_KEY env var not set');

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

  const prompt = `Summarize this GitHub repository for display in a minimal terminal portfolio.

Output exactly 2 short paragraphs separated by a blank line:
1. What the project does and its purpose (2-3 sentences max).
2. Key technical observations about the stack and architecture (2-3 sentences max).

Rules:
- Plain text only. No markdown, no asterisks, no headers, no bullet points.
- Be specific and technical. Under 80 words total.
- Do not start with "This project" or "This repository".

README:
${data.readme || '(no readme)'}

Detected languages: ${data.languages.join(', ') || '(none detected)'}`;

  const result = await model.generateContentStream(prompt);
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}
