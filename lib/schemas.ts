import { z } from "zod";

export const EventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  visibility: z.enum(["CORE", "MEMBER", "PUBLIC"]).optional().default("CORE"),
  customFields: z.record(z.string(), z.any()).optional().default({}),
});

export const ProgramSchema = z.object({
  title: z.string().min(1, "Title is required"),
  lead: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  visibility: z.enum(["CORE", "MEMBER", "PUBLIC"]).optional().default("CORE"),
  customFields: z.record(z.string(), z.any()).optional().default({}),
});

export const ContentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["Blog", "Video", "Whitepaper", "Case Study"]).optional().default("Blog"),
  content: z.string().optional().or(z.literal("")),
  customFields: z.record(z.string(), z.any()).optional().default({}),
});

export const MediaItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().or(z.literal("")),
  platform: z.array(z.string()).optional().default([]),
  links: z.array(z.string()).optional().default([]),
});

export const CommentSchema = z.object({
  mediaId: z.string().min(1, "Media ID is required"),
  content: z.string().min(1, "Content is required"),
});

export const PlaybookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().or(z.literal("")),
  visibility: z.enum(["CORE", "MEMBER", "PUBLIC"]).optional().default("CORE"),
  coverImage: z.string().optional().nullable(),
});

export const MediaStatusSchema = z.object({
  status: z.enum(['draft', 'pending_approval', 'needs_edit', 'approved', 'posted']),
  postUrl: z.string().optional(),
});

