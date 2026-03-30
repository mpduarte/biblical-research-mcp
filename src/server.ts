import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

import {
  handleVerseCommentary,
  verseCommentaryInputSchema,
} from "./tools/verseCommentary.js";
import {
  handlePassageOutline,
  passageOutlineInputSchema,
} from "./tools/passageOutline.js";
import {
  handleTheologicalPosition,
  theologicalPositionInputSchema,
} from "./tools/theologicalPosition.js";

// ─── Server definition ────────────────────────────────────────────────────────

export function createServer(): Server {
  const server = new Server(
    {
      name: "biblical-research-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // ─── List tools ─────────────────────────────────────────────────────────────

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "get_verse_commentary",
        description:
          "Research and synthesize deep exegetical commentary on a Bible passage from a Calvary Chapel theological perspective. Pulls live commentary from Blue Letter Bible, Enduring Word (David Guzik), and Thru the Bible (J. Vernon McGee). Returns structured JSON with commentator views, Greek/Hebrew word studies, cross-references, and a unified synthesis — plus a markdown rendering for human readability.",
        inputSchema: verseCommentaryInputSchema,
      },
      {
        name: "get_passage_outline",
        description:
          "Generate a structural sermon/teaching outline for a Bible chapter or passage. Researches expository outlines from Calvary Chapel-aligned sources (Guzik, Blue Letter Bible, Matthew Henry). Returns a JSON outline with logical passage divisions, themes, key verses, and a suggested teaching flow — ideal for sermon planning.",
        inputSchema: passageOutlineInputSchema,
      },
      {
        name: "get_theological_position",
        description:
          "Return the Calvary Chapel theological position on a specific doctrinal topic (e.g., 'eternal security', 'rapture timing', 'spiritual gifts', 'baptism', 'predestination'). Includes supporting scripture, source citations, and a brief note on how other evangelical traditions differ.",
        inputSchema: theologicalPositionInputSchema,
      },
    ],
  }));

  // ─── Call tools ─────────────────────────────────────────────────────────────

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "get_verse_commentary":
          return await handleVerseCommentary(args);

        case "get_passage_outline":
          return await handlePassageOutline(args);

        case "get_theological_position":
          return await handleTheologicalPosition(args);

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
      }
    } catch (err) {
      // Re-throw MCP errors as-is
      if (err instanceof McpError) throw err;

      // Wrap unexpected errors with context
      const message = err instanceof Error ? err.message : String(err);
      throw new McpError(
        ErrorCode.InternalError,
        `Tool '${name}' failed: ${message}`
      );
    }
  });

  return server;
}
