import { z } from "zod";
import { runWithWebSearch, parseJsonResponse } from "../claude/client.js";
import {
  buildVerseCommentarySystemPrompt,
  buildVerseCommentaryUserPrompt,
} from "../claude/prompts.js";
import type {
  VerseCommentaryInput,
  VerseCommentaryResult,
} from "../types/index.js";

// ─── Input schema (for MCP tool registration) ────────────────────────────────

export const verseCommentaryInputSchema = {
  type: "object",
  properties: {
    book: {
      type: "string",
      description: "Bible book name (e.g., 'Genesis', 'Romans', 'Revelation')",
    },
    chapter: {
      type: "integer",
      description: "Chapter number",
    },
    verse_start: {
      type: "integer",
      description: "Starting verse number",
    },
    verse_end: {
      type: "integer",
      description:
        "Ending verse number (same as verse_start for single verse). Omit for single verse.",
    },
    depth: {
      type: "string",
      enum: ["concise", "standard", "deep"],
      default: "deep",
      description:
        "Commentary depth. 'deep' is the default — full exegetical treatment with multiple commentator views.",
    },
    include_cross_references: {
      type: "boolean",
      default: true,
      description: "Include Treasury of Scripture Knowledge cross-references",
    },
    include_word_studies: {
      type: "boolean",
      default: true,
      description: "Include Greek/Hebrew word studies from Strong's",
    },
    format: {
      type: "string",
      enum: ["json", "markdown", "both"],
      default: "both",
      description:
        "Response format. 'both' returns a JSON object with a parallel markdown rendering.",
    },
  },
  required: ["book", "chapter", "verse_start"],
} as const;

// ─── Zod validation ───────────────────────────────────────────────────────────

const VerseCommentaryInputSchema = z.object({
  book: z.string().min(1),
  chapter: z.number().int().positive(),
  verse_start: z.number().int().positive(),
  verse_end: z.number().int().positive().nullable().optional(),
  depth: z.enum(["concise", "standard", "deep"]).default("deep"),
  include_cross_references: z.boolean().default(true),
  include_word_studies: z.boolean().default(true),
  format: z.enum(["json", "markdown", "both"]).default("both"),
});

// ─── Tool handler ─────────────────────────────────────────────────────────────

export async function handleVerseCommentary(
  args: unknown
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const input = VerseCommentaryInputSchema.parse(args) as VerseCommentaryInput;

  const systemPrompt = buildVerseCommentarySystemPrompt();
  const userPrompt = buildVerseCommentaryUserPrompt(input);

  const raw = await runWithWebSearch(systemPrompt, userPrompt);
  const result = parseJsonResponse<VerseCommentaryResult>(raw);

  const format = input.format ?? "both";

  if (format === "markdown") {
    return {
      content: [{ type: "text", text: result.markdown }],
    };
  }

  if (format === "json") {
    const { markdown: _markdown, ...jsonOnly } = result;
    return {
      content: [{ type: "text", text: JSON.stringify(jsonOnly, null, 2) }],
    };
  }

  // "both" — return full result including markdown field
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}
