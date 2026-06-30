import { z } from 'zod';

export const LinkSchema = z.object({
  github: z.string().url().optional(),
  x: z.string().url().optional(),
  linkedin: z.string().url().optional(),
});

export const ProjectSchema = z.object({
  title: z.string(),
  description: z.string(),
  stack: z.array(z.string()).default([]),
  repo: z.string().url().optional(),
  lastCommit: z.string().optional(), // e.g. "2024-11"
});

export const ExperienceSchema = z.object({
  role: z.string(),
  company: z.string(),
  period: z.string(),
  summary: z.string(),
});

export const PortfolioSchema = z.object({
  name: z.string(),
  headline: z.string().optional(),
  location: z.string().optional(),
  bio: z.string(),
  links: LinkSchema.optional(),
  contact: z.string().optional(),
  contactable: z.boolean().default(false),
  projects: z.array(ProjectSchema).min(1),
  experience: z.array(ExperienceSchema).default([]),
});

export type Links = z.infer<typeof LinkSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Portfolio = z.infer<typeof PortfolioSchema>;
