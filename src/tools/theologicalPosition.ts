import { z } from "zod";
import { runWithWebSearch, parseJsonResponse } from "../claude/client.js";
import {
  buildTheologicalPositionSystemPrompt,
  buildTheologicalPositionUserPrompt,
} from "../claude/prompts.js";
import type { TheologicalPositionResult } from "../types/index.js";

// ─── Input schema (for MCP tool registration) ────────────────────────────────

export const theologicalPositionInputSchema = {
  type: "object",
  properties: {
    topic: {
      type: "string",
      description:
        "Doctrinal topic (e.g., 'eternal security', 'spiritual gifts', 'rapture timing', 'baptism', 'predestination')",
    },
  },
  required: ["topic"],
} as const;

// ─── Zod validation ───────────────────────────────────────────────────────────

const TheologicalPositionInputSchema = z.object({
  topic: z.string().min(1),
});

// ─── Tool handler ─────────────────────────────────────────────────────────────

export async function handleTheologicalPosition(
  args: unknown
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const { topic } = TheologicalPositionInputSchema.parse(args);

  const systemPrompt = buildTheologicalPositionSystemPrompt();
  const userPrompt = buildTheologicalPositionUserPrompt(topic);

  const raw = await runWithWebSearch(systemPrompt, userPrompt);
  const result = parseJsonResponse<TheologicalPositionResult>(raw);

  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}
