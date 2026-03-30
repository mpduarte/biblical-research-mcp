# Biblical Research MCP

An MCP (Model Context Protocol) server that provides verse-by-verse Biblical commentary research from a **Calvary Chapel theological perspective**. Designed as a backend service agent for sermon and teaching preparation workflows.

It searches live commentary sources at runtime — Blue Letter Bible, Enduring Word (David Guzik), and Thru the Bible (J. Vernon McGee) — and synthesizes them into structured JSON + Markdown output.

---

## Tools

### `get_verse_commentary`
Deep exegetical commentary on a Bible passage. Returns commentator views, Greek/Hebrew word studies, cross-references, and a unified Calvary Chapel synthesis.

```json
{
  "book": "Romans",
  "chapter": 8,
  "verse_start": 28,
  "verse_end": 30,
  "depth": "deep",
  "include_cross_references": true,
  "include_word_studies": true,
  "format": "both"
}
```

### `get_passage_outline`
Sermon/teaching outline for a chapter or passage range. Returns logical section divisions, themes, key verses, and a suggested teaching flow.

```json
{
  "book": "John",
  "chapter": 3
}
```

### `get_theological_position`
Calvary Chapel position on a doctrinal topic, with supporting scripture and brief acknowledgment of other evangelical views.

```json
{
  "topic": "eternal security"
}
```

---

## Theological Framework

All output adheres to the Calvary Chapel tradition:

- **Verse-by-verse expository method** — the text drives the commentary
- **Grace-centered, not legalistic** — obedience as a response to grace
- **Historical-grammatical hermeneutic** — original languages, cultural context
- **Pre-tribulation dispensational eschatology** — for prophetic passages

---

## Setup

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Install & Build

```bash
git clone https://github.com/YOUR_USERNAME/biblical-research-mcp.git
cd biblical-research-mcp
npm install
npm run build
```

> **Corporate/VPN network?** If you get SSL certificate errors, use:
> ```bash
> npm install --strict-ssl false
> ```

### Configure

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

Key environment variables:

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | **Required.** Your Anthropic API key. |
| `BIBLICAL_RESEARCH_MODEL` | `claude-sonnet-4-6` | Model to use. Swap to `claude-opus-4-6` for maximum quality. |
| `BIBLICAL_RESEARCH_MAX_TOKENS` | `8096` | Max tokens per response. |
| `BIBLICAL_RESEARCH_CACHE` | `true` | Set to `false` to disable response caching. |
| `BIBLICAL_RESEARCH_CACHE_TTL_HOURS` | `168` | Cache TTL in hours (default: 7 days). |

---

## Claude Desktop Integration

Add to your `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "biblical-research": {
      "command": "node",
      "args": ["/absolute/path/to/biblical-research-mcp/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-...",
        "BIBLICAL_RESEARCH_MODEL": "claude-sonnet-4-6"
      }
    }
  }
}
```

Restart Claude Desktop after updating the config.

---

## Test a Live Call

```bash
# Romans 8:28-30 verse commentary (default)
ANTHROPIC_API_KEY=sk-ant-... node test.mjs

# Passage outline
ANTHROPIC_API_KEY=sk-ant-... TEST_TOOL=outline TEST_BOOK=John TEST_CHAPTER=3 node test.mjs

# Doctrinal position
ANTHROPIC_API_KEY=sk-ant-... TEST_TOOL=doctrine TEST_TOPIC="spiritual gifts" node test.mjs

# Force fresh results (bypass cache)
ANTHROPIC_API_KEY=sk-ant-... BIBLICAL_RESEARCH_CACHE=false node test.mjs
```

---

## Caching

Responses are cached to `.cache/` (SHA-256 keyed, 7-day TTL by default) to avoid redundant API calls for the same passage. The cache directory is `.gitignore`d.

---

## Commentary Sources

| Source | Commentator(s) |
|---|---|
| [Blue Letter Bible](https://www.blueletterbible.org) | Chuck Smith (C2000), Matthew Henry, Albert Barnes, Adam Clarke, John Gill, Jamieson-Fausset-Brown, Scofield, Strong's, TSK |
| [Enduring Word](https://enduringword.com) | David Guzik |
| [Thru the Bible](https://www.ttb.org) | J. Vernon McGee |

---

## Project Structure

```
src/
├── index.ts                    # Entry point, stdio MCP transport
├── server.ts                   # MCP server and tool routing
├── cache.ts                    # File-based response cache
├── types/index.ts              # Shared TypeScript interfaces
├── claude/
│   ├── client.ts               # Anthropic SDK + web_search agentic loop
│   └── prompts.ts              # System/user prompts for all tools
└── tools/
    ├── verseCommentary.ts
    ├── passageOutline.ts
    └── theologicalPosition.ts
```

---

## License

MIT
