'use server';
/**
 * @fileOverview An AI agent that analyzes job descriptions and suggests relevant freelancers.
 *
 * - suggestFreelancers - A function that handles the freelancer suggestion process.
 * - SuggestFreelancersInput - The input type for the suggestFreelancers function.
 * - SuggestFreelancersOutput - The return type for the suggestFreelancers function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FreelancerSchema = z.object({
  id: z.string().describe('The unique identifier for the freelancer.'),
  name: z.string().describe('The name of the freelancer.'),
  bio: z.string().describe('A brief biography of the freelancer, highlighting their experience and expertise.'),
  skills: z.array(z.string()).describe('A list of skills possessed by the freelancer.'),
});

const SuggestFreelancersInputSchema = z.object({
  jobDescription: z.string().describe('A detailed description of the job post, including requirements and expectations.'),
  availableFreelancers: z.array(FreelancerSchema).describe('An array of available freelancers, each with their ID, name, bio, and skills.'),
});
export type SuggestFreelancersInput = z.infer<typeof SuggestFreelancersInputSchema>;

const SuggestFreelancersOutputSchema = z.object({
  suggestedFreelancerIds: z.array(z.string()).describe('An array of unique identifiers for the suggested freelancers who best match the job description.'),
});
export type SuggestFreelancersOutput = z.infer<typeof SuggestFreelancersOutputSchema>;

export async function suggestFreelancers(input: SuggestFreelancersInput): Promise<SuggestFreelancersOutput> {
  return suggestFreelancersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFreelancersPrompt',
  input: { schema: SuggestFreelancersInputSchema },
  output: { schema: SuggestFreelancersOutputSchema },
  prompt: `You are an AI assistant specialized in matching job descriptions with suitable freelancers.
Your task is to analyze a given job description and a list of available freelancers, then identify the freelancers who are the best match for the job.
Consider the freelancer's bio and skills when making your decision.
Prioritize freelancers whose skills directly align with the job requirements and whose bio suggests relevant experience.
Select up to 5 of the most relevant freelancers.

Job Description:
{{{jobDescription}}}

Available Freelancers:
{{#each availableFreelancers}}
  ID: {{{id}}}
  Name: {{{name}}}
  Bio: {{{bio}}}
  Skills: {{#each skills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
---
{{/each}}

Please provide the IDs of the suggested freelancers as a JSON array of strings.
For example: { "suggestedFreelancerIds": ["freelancerId1", "freelancerId2"] }`,
});

const suggestFreelancersFlow = ai.defineFlow(
  {
    name: 'suggestFreelancersFlow',
    inputSchema: SuggestFreelancersInputSchema,
    outputSchema: SuggestFreelancersOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
