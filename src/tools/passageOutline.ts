import { z } from "zod";
import { runWithWebSearch, parseJsonResponse } from "../claude/client.js";
import {
  buildPassageOutlineSystemPrompt,
  buildPassageOutlineUserPrompt,
} from "../claude/prompts.js";
import type {
  PassageOutlineInput,
  PassageOutlineResult,
} from "../types/index.js";

// ─── Input schema (for MCP tool registration) ────────────────────────────────

export const passageOutlineInputSchema = {
  type: "object",
  properties: {
    book: {
      type: "string",
      description: "Bible book name (e.g., 'John', 'Ephesians')",
    },
    chapter: {
      type: "integer",
      description: "Chapter number",
    },
    verse_start: {
      type: "integer",
      description: "Starting verse (default: 1 — beginning of chapter)",
    },
    verse_end: {
      type: "integer",
      description: "Ending verse (default: end of chapter). Omit for entire chapter.",
    },
  },
  required: ["book", "chapter"],
} as const;

// ─── Zod validation ───────────────────────────────────────────────────────────

const PassageOutlineInputSchema = z.object({
  book: z.string().min(1),
  chapter: z.number().int().positive(),
  verse_start: z.number().int().positive().optional(),
  verse_end: z.number().int().positive().nullable().optional(),
});

// ─── Tool handler ─────────────────────────────────────────────────────────────

export async function handlePassageOutline(
  args: unknown
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const input = PassageOutlineInputSchema.parse(args) as PassageOutlineInput;

  const systemPrompt = buildPassageOutlineSystemPrompt();
  const userPrompt = buildPassageOutlineUserPrompt(input);

  const raw = await runWithWebSearch(systemPrompt, userPrompt);
  const result = parseJsonResponse<PassageOutlineResult>(raw);

  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}
