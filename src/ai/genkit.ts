import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Genkit initialization is commented out as per user request to remove AI features.
// If Genkit is completely removed from the project, this file and related configurations
// in package.json (genkit scripts) might also be removed.
export const ai = {}; // Provide a dummy export to prevent import errors if other files still import `ai`

/*
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
*/
