#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main() {
  // Validate API key early for a clear error message
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "[biblical-research-mcp] Error: ANTHROPIC_API_KEY environment variable is not set.\n" +
        "Set it before starting the server:\n" +
        "  export ANTHROPIC_API_KEY=sk-ant-...\n" +
        "Or add it to your Claude Desktop MCP configuration's env block."
    );
    process.exit(1);
  }

  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Log to stderr so it doesn't pollute the MCP stdio protocol on stdout
  console.error(
    `[biblical-research-mcp] Server started. Model: ${process.env.BIBLICAL_RESEARCH_MODEL ?? "claude-opus-4-6"}`
  );
}

main().catch((err) => {
  console.error("[biblical-research-mcp] Fatal error:", err);
  process.exit(1);
});
