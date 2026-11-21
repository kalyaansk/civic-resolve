import { z } from "zod";
import {
  COMPLETION_RECOMMENDED_ACTIONS,
  COMPLETION_VERDICTS,
  ISSUE_CATEGORIES,
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  MUNICIPAL_DEPARTMENTS,
} from "@/types/issue";

/**
 * Zod validation schemas for API payloads, regional query filters, and Gemini structured output.
 */

export const issueLocationSchema = z.object({
  address: z
    .string()
    .trim()
    .min(3, "Street address must be at least 3 characters.")
    .max(200, "Street address must be under 200 characters."),
  city: z
    .string()
    .trim()
    .min(2, "City is required (at least 2 characters).")
    .max(100, "City name must be under 100 characters."),
  state: z
    .string()
    .trim()
    .min(2, "State is required (at least 2 characters).")
    .max(100, "State name must be under 100 characters."),
  district: z
    .string()
    .trim()
    .max(100, "District / Locality must be under 100 characters.")
    .optional()
    .default(""),
  lat: z.coerce
    .number()
    .min(-90, "Latitude must be >= -90.")
    .max(90, "Latitude must be <= 90."),
  lng: z.coerce
    .number()
    .min(-180, "Longitude must be >= -180.")
    .max(180, "Longitude must be <= 180."),
});

export const createIssueSchema = z.object({
  title: z
    .string()
    .trim()
    .min(6, "Issue title must be at least 6 characters.")
    .max(140, "Issue title cannot exceed 140 characters."),
  description: z
    .string()
    .trim()
    .min(15, "Please provide at least 15 characters describing the issue.")
    .max(1000, "Description cannot exceed 1,000 characters."),
  categoryOverride: z.enum(ISSUE_CATEGORIES).optional().nullable(),
  location: issueLocationSchema,
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;

export const triagePreviewSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, "Enter at least 4 characters for the issue title.")
    .max(140),
  description: z
    .string()
    .trim()
    .min(10, "Enter at least 10 characters of description.")
    .max(1000),
  address: z.string().trim().max(240).optional().default(""),
  categoryOverride: z.enum(ISSUE_CATEGORIES).optional().nullable(),
  imageBase64: z.string().max(7_500_000).optional().nullable(),
  imageMimeType: z
    .enum(["image/jpeg", "image/png", "image/webp"])
    .optional()
    .nullable(),
});

export type TriagePreviewInput = z.infer<typeof triagePreviewSchema>;

export const updateIssueSchema = z
  .object({
    status: z.enum(ISSUE_STATUSES).optional(),
    priority: z.enum(ISSUE_PRIORITIES).optional(),
    department: z.enum(MUNICIPAL_DEPARTMENTS).optional(),
    resolutionNote: z
      .string()
      .trim()
      .max(1000, "Resolution note cannot exceed 1,000 characters.")
      .optional(),
    reviewDecision: z.enum(["approve", "reject"]).optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.priority !== undefined ||
      data.department !== undefined ||
      data.resolutionNote !== undefined ||
      data.reviewDecision !== undefined,
    { message: "At least one field must be provided for update." },
  );

export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;

export const workerStartActionSchema = z.object({
  action: z.literal("start"),
  note: z.string().trim().max(500).optional(),
});

export type WorkerStartActionInput = z.infer<typeof workerStartActionSchema>;

export const workerCompletionNoteSchema = z
  .string()
  .trim()
  .min(10, "Completion summary must be at least 10 characters.")
  .max(1000, "Completion summary cannot exceed 1,000 characters.");

export const listIssuesQuerySchema = z.object({
  search: z.string().trim().max(120).optional().default(""),
  state: z.string().trim().max(100).optional().default("All"),
  city: z.string().trim().max(100).optional().default("All"),
  status: z.enum(["All", ...ISSUE_STATUSES]).optional().default("All"),
  priority: z.enum(["All", ...ISSUE_PRIORITIES]).optional().default("All"),
  category: z.enum(["All", ...ISSUE_CATEGORIES]).optional().default("All"),
  department: z
    .enum(["All", ...MUNICIPAL_DEPARTMENTS])
    .optional()
    .default("All"),
  mine: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((v) => v === true || v === "true"),
  sort: z.enum(["urgency", "recent", "upvotes"]).optional().default("recent"),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  cursor: z.string().trim().max(120).optional(),
});

export type ListIssuesQuery = z.infer<typeof listIssuesQuerySchema>;

/** Strict Zod schema for parsing structured JSON returned by Gemini AI. */
export const aiAnalysisResponseSchema = z.object({
  isValidCivicIssue: z.boolean().default(true),
  promptInjectionDetected: z.boolean().default(false),
  rejectionReason: z.string().trim().max(400).optional().nullable(),
  category: z.enum(ISSUE_CATEGORIES),
  confidence: z.coerce.number().min(0).max(100),
  priority: z.enum(ISSUE_PRIORITIES),
  urgencyScore: z.coerce.number().int().min(1).max(100),
  recommendedDepartment: z.enum(MUNICIPAL_DEPARTMENTS),
  estimatedImpact: z.string().trim().min(5).max(300),
  reasoning: z.string().trim().min(10).max(600),
  imageAltText: z.string().trim().min(5).max(240),
});

export type RawAIAnalysisOutput = z.infer<typeof aiAnalysisResponseSchema>;

/** Strict Zod schema for Gemini AI before-vs-after completion verification output. */
export const completionVerificationResponseSchema = z.object({
  verified: z.boolean(),
  verdict: z.enum(COMPLETION_VERDICTS),
  confidence: z.coerce.number().min(0).max(100),
  summary: z.string().trim().min(10).max(600),
  recommendedAction: z.enum(COMPLETION_RECOMMENDED_ACTIONS),
});

export type RawCompletionVerificationOutput = z.infer<
  typeof completionVerificationResponseSchema
>;
