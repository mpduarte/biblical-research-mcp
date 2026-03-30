#!/usr/bin/env node
/**
 * Live tool test — fires a real MCP tool call via the server's internal handlers.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... node test.mjs
 *
 * Optional env overrides:
 *   BIBLICAL_RESEARCH_MODEL=claude-sonnet-4-6   (default)
 *   BIBLICAL_RESEARCH_CACHE=false               (skip cache for fresh results)
 *   TEST_TOOL=verse|outline|doctrine            (which tool to test, default: verse)
 *   TEST_BOOK=Romans TEST_CHAPTER=8 TEST_VERSE=28 TEST_VERSE_END=30
 */

import { createRequire } from "module";
import { fileURLToPath, pathToFileURL } from "url";
import { join, dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Verify API key
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY is not set.");
  console.error("Usage: ANTHROPIC_API_KEY=sk-ant-... node test.mjs");
  process.exit(1);
}

const tool = process.env.TEST_TOOL ?? "verse";
const book = process.env.TEST_BOOK ?? "Romans";
const chapter = parseInt(process.env.TEST_CHAPTER ?? "8", 10);
const verseStart = parseInt(process.env.TEST_VERSE ?? "28", 10);
const verseEnd = process.env.TEST_VERSE_END
  ? parseInt(process.env.TEST_VERSE_END, 10)
  : null;

// Dynamically import from dist/
const distBase = pathToFileURL(join(__dirname, "dist")).href + "/";

async function runTest() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Biblical Research MCP — Live Tool Test`);
  console.log(`Model: ${process.env.BIBLICAL_RESEARCH_MODEL ?? "claude-sonnet-4-6"}`);
  console.log(`Cache: ${process.env.BIBLICAL_RESEARCH_CACHE !== "false" ? "enabled" : "disabled"}`);
  console.log(`${"=".repeat(60)}\n`);

  if (tool === "verse") {
    const ref = verseEnd ? `${book} ${chapter}:${verseStart}-${verseEnd}` : `${book} ${chapter}:${verseStart}`;
    console.log(`Tool: get_verse_commentary`);
    console.log(`Passage: ${ref}`);
    console.log(`Depth: deep\n`);
    console.log("Searching commentary sources... (this may take 30-60 seconds)\n");

    const { handleVerseCommentary } = await import(distBase + "tools/verseCommentary.js");

    const start = Date.now();
    const result = await handleVerseCommentary({
      book,
      chapter,
      verse_start: verseStart,
      verse_end: verseEnd,
      depth: "deep",
      include_cross_references: true,
      include_word_studies: true,
      format: "both",
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    const parsed = JSON.parse(result.content[0].text);
    console.log(`✓ Done in ${elapsed}s\n`);
    console.log("─── Passage ─────────────────────────────────────────────────");
    console.log(`${parsed.passage.reference} (${parsed.passage.translation})`);
    console.log(`"${parsed.passage.text}"\n`);
    console.log("─── Summary ─────────────────────────────────────────────────");
    console.log(parsed.commentary.summary + "\n");
    console.log("─── Commentators Found ──────────────────────────────────────");
    for (const cv of parsed.commentary.commentator_views) {
      console.log(`• ${cv.commentator} (${cv.source})`);
      console.log(`  ${cv.emphasis}`);
    }
    console.log("\n─── Word Studies ────────────────────────────────────────────");
    for (const ws of (parsed.word_studies ?? [])) {
      console.log(`• "${ws.word}" — ${ws.original} (${ws.strongs})`);
      console.log(`  ${ws.usage_note}`);
    }
    console.log("\n─── Cross References ────────────────────────────────────────");
    for (const cr of (parsed.cross_references ?? [])) {
      console.log(`• ${cr.reference}: ${cr.relevance}`);
    }
    console.log("\n─── Application ─────────────────────────────────────────────");
    console.log(`Teaching hook: ${parsed.application.teaching_hook}`);
    console.log(`Key doctrine:  ${parsed.application.key_doctrine}`);

    console.log("\n─── Full Markdown Output ────────────────────────────────────");
    console.log(parsed.markdown);

  } else if (tool === "outline") {
    console.log(`Tool: get_passage_outline`);
    console.log(`Passage: ${book} ${chapter}\n`);
    console.log("Building passage outline... (this may take 20-40 seconds)\n");

    const { handlePassageOutline } = await import(distBase + "tools/passageOutline.js");

    const start = Date.now();
    const result = await handlePassageOutline({ book, chapter });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    const parsed = JSON.parse(result.content[0].text);
    console.log(`✓ Done in ${elapsed}s\n`);
    console.log(parsed.markdown);

  } else if (tool === "doctrine") {
    const topic = process.env.TEST_TOPIC ?? "eternal security";
    console.log(`Tool: get_theological_position`);
    console.log(`Topic: ${topic}\n`);
    console.log("Researching doctrinal position... (this may take 20-40 seconds)\n");

    const { handleTheologicalPosition } = await import(distBase + "tools/theologicalPosition.js");

    const start = Date.now();
    const result = await handleTheologicalPosition({ topic });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    const parsed = JSON.parse(result.content[0].text);
    console.log(`✓ Done in ${elapsed}s\n`);
    console.log(parsed.markdown);

  } else {
    console.error(`Unknown TEST_TOOL: "${tool}". Use: verse, outline, or doctrine`);
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error("\nTest failed:", err.message ?? err);
  process.exit(1);
});
