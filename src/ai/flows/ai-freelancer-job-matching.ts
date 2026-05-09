'use server';
/**
 * @fileOverview An AI-powered tool for matching freelancers to relevant job opportunities.
 *
 * - matchFreelancerToJobs - A function that leverages AI to recommend job opportunities for a freelancer.
 * - AIFreelancerJobMatchingInput - The input type for the matchFreelancerToJobs function.
 * - AIFreelancerJobMatchingOutput - The return type for the matchFreelancerToJobs function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIFreelancerJobMatchingInputSchema = z.object({
  freelancerBio: z.string().describe("The freelancer's biography, describing their background and expertise."),
  freelancerSkills: z.array(z.string()).describe("A list of the freelancer's key skills and areas of specialization."),
  freelancerExperience: z.string().describe("A summary of the freelancer's professional experience and past projects."),
  jobOpportunities: z.array(
    z.object({
      id: z.string().describe("Unique identifier for the job opportunity."),
      title: z.string().describe("The title of the job opportunity."),
      description: z.string().describe("A detailed description of the job, including responsibilities and project scope."),
      requiredSkills: z.array(z.string()).describe("A list of skills required or preferred for this job."),
    })
  ).describe("A list of available job opportunities to consider for recommendation."),
});
export type AIFreelancerJobMatchingInput = z.infer<typeof AIFreelancerJobMatchingInputSchema>;

const AIFreelancerJobMatchingOutputSchema = z.object({
  recommendedJobs: z.array(
    z.object({
      id: z.string().describe("The unique identifier of the recommended job."),
      relevanceScore: z.number().min(0).max(100).describe("A score from 0-100 indicating how relevant the job is to the freelancer's profile."),
      reason: z.string().describe("A brief explanation for why this job is recommended, highlighting key matches."),
    })
  ).describe("A list of job opportunities recommended for the freelancer, sorted by relevance."),
});
export type AIFreelancerJobMatchingOutput = z.infer<typeof AIFreelancerJobMatchingOutputSchema>;

export async function matchFreelancerToJobs(input: AIFreelancerJobMatchingInput): Promise<AIFreelancerJobMatchingOutput> {
  return aiFreelancerJobMatchingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiFreelancerJobMatchingPrompt',
  input: {schema: AIFreelancerJobMatchingInputSchema},
  output: {schema: AIFreelancerJobMatchingOutputSchema},
  prompt: `You are an AI-powered job matching assistant for a freelance marketplace. Your task is to analyze a freelancer's detailed profile and a list of available job opportunities, then recommend the most relevant jobs that align with their expertise.

Consider the freelancer's skills, experience, and biography carefully when evaluating job opportunities.

Freelancer Profile:
Bio: {{{freelancerBio}}}
Skills:
{{#each freelancerSkills}}
- {{{this}}}
{{/each}}
Experience: {{{freelancerExperience}}}

Available Job Opportunities to Evaluate:
{{#each jobOpportunities}}
---
Job ID: {{{id}}}
Title: {{{title}}}
Description: {{{description}}}
Required Skills:
{{#each requiredSkills}}
- {{{this}}}
{{/each}}
---
{{/each}}

Based on the freelancer's profile and the available job opportunities, identify and list only those jobs that are highly relevant. For each relevant job, provide a 'relevanceScore' (a number from 0-100, where 100 is a perfect match) and a concise 'reason' explaining why it's a good fit. Only include jobs that have a relevance score above 50.

Please ensure your output strictly adheres to the provided JSON schema.`
});

const aiFreelancerJobMatchingFlow = ai.defineFlow(
  {
    name: 'aiFreelancerJobMatchingFlow',
    inputSchema: AIFreelancerJobMatchingInputSchema,
    outputSchema: AIFreelancerJobMatchingOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
