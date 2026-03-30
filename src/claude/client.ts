import Anthropic from "@anthropic-ai/sdk";
import { getCached, setCached } from "../cache.js";

// ─── Singleton Anthropic client ───────────────────────────────────────────────

const MODEL = process.env.BIBLICAL_RESEARCH_MODEL ?? "claude-sonnet-4-6";
const MAX_TOKENS = parseInt(process.env.BIBLICAL_RESEARCH_MAX_TOKENS ?? "8096", 10);
const MAX_LOOP_ITERATIONS = 10;

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required");
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

// ─── Agentic loop with web_search ────────────────────────────────────────────

/**
 * Runs a Claude API call with the web_search_20250305 tool enabled.
 *
 * The web_search_20250305 tool is a server-side tool — Anthropic executes the
 * searches internally. This loop handles the tool-use protocol: when Claude
 * emits tool_use blocks, we send back tool_result placeholders so Claude can
 * continue processing the search results it received server-side.
 *
 * Returns the final text content from Claude's response.
 */
export async function runWithWebSearch(
  systemPrompt: string,
  userQuery: string
): Promise<string> {
  // Return cached result if available (avoids repeat API calls for same passage)
  const cached = getCached(systemPrompt, userQuery);
  if (cached) {
    console.error("[biblical-research-mcp] Cache hit — skipping API call");
    return cached;
  }

  const client = getClient();

  type MessageParam = Anthropic.Messages.MessageParam;
  const messages: MessageParam[] = [{ role: "user", content: userQuery }];

  for (let iteration = 0; iteration < MAX_LOOP_ITERATIONS; iteration++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
        } as unknown as Anthropic.Messages.Tool,
      ],
      messages,
    });

    // Collect all text blocks from this response
    const textBlocks = response.content.filter(
      (block): block is Anthropic.Messages.TextBlock => block.type === "text"
    );

    if (response.stop_reason === "end_turn") {
      if (textBlocks.length === 0) {
        throw new Error("Claude returned end_turn with no text content");
      }
      const result = textBlocks.map((b) => b.text).join("\n");
      setCached(systemPrompt, userQuery, result);
      return result;
    }

    if (response.stop_reason === "tool_use") {
      // Add the assistant's response (with tool_use blocks) to message history
      messages.push({ role: "assistant", content: response.content });

      // Build tool_result blocks for every tool_use block.
      // For web_search_20250305 (server-side tool), Anthropic ran the searches
      // internally. We acknowledge each tool_use with an empty tool_result so
      // Claude can proceed to synthesize the results it already received.
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.Messages.ToolUseBlock =>
          block.type === "tool_use"
      );

      if (toolUseBlocks.length === 0) {
        // tool_use stop_reason but no tool_use blocks — shouldn't happen
        throw new Error(
          "Unexpected: stop_reason=tool_use but no tool_use blocks found"
        );
      }

      const toolResults: Anthropic.Messages.ToolResultBlockParam[] =
        toolUseBlocks.map((block) => ({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: [],
        }));

      messages.push({ role: "user", content: toolResults });
      continue;
    }

    // max_tokens or other stop reasons
    if (response.stop_reason === "max_tokens") {
      throw new Error(
        "Claude hit max_tokens limit. Consider increasing BIBLICAL_RESEARCH_MAX_TOKENS."
      );
    }

    throw new Error(`Unexpected stop_reason: ${response.stop_reason}`);
  }

  throw new Error(
    `Claude tool-use loop exceeded ${MAX_LOOP_ITERATIONS} iterations without reaching end_turn`
  );
}

/**
 * Parses a JSON response from Claude, stripping markdown code fences if present.
 * Throws a descriptive error if parsing fails.
 */
export function parseJsonResponse<T>(raw: string): T {
  // Strip markdown code fences (```json ... ```) if Claude wrapped the output
  const stripped = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  try {
    return JSON.parse(stripped) as T;
  } catch (err) {
    // Try to extract JSON from the response if there's leading/trailing text
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch {
        // Fall through to the original error
      }
    }
    throw new Error(
      `Failed to parse Claude's response as JSON.\n\nRaw response (first 500 chars):\n${raw.slice(0, 500)}\n\nParse error: ${err}`
    );
  }
}
