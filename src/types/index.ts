// ─── Shared response types for all three MCP tools ───────────────────────────

export interface PassageText {
  reference: string;
  translation: "NKJV" | "KJV";
  text: string;
}

export interface CommentatorView {
  commentator: string;
  source: string;
  source_url: string | null;
  summary: string;
  emphasis: string;
}

export interface WordStudy {
  word: string;
  original: string;
  strongs: string;
  definition: string;
  usage_note: string;
}

export interface CrossReference {
  reference: string;
  text: string;
  relevance: string;
}

export interface ApplicationSection {
  teaching_hook: string;
  key_doctrine: string;
  common_misreadings: string[];
}

export interface CommentarySection {
  summary: string;
  commentator_views: CommentatorView[];
  synthesis: string;
}

// ─── get_verse_commentary output ─────────────────────────────────────────────

export interface VerseCommentaryResult {
  passage: PassageText;
  commentary: CommentarySection;
  word_studies: WordStudy[] | null;
  cross_references: CrossReference[] | null;
  application: ApplicationSection;
  markdown: string;
}

// ─── get_passage_outline output ───────────────────────────────────────────────

export interface OutlineSection {
  section: string;
  verses: string;
  heading: string;
  subpoints: string[];
  key_verse: string | null;
}

export interface PassageOutlineResult {
  passage: {
    reference: string;
    translation: "NKJV" | "KJV";
    text_range: string;
  };
  title: string;
  theme: string;
  outline: OutlineSection[];
  teaching_flow: string;
  preaching_angle: string;
  markdown: string;
}

// ─── get_theological_position output ─────────────────────────────────────────

export interface TheologicalPositionEntry {
  source: string;
  tradition: string;
  summary: string;
  supporting_verses: string[];
  caveats: string | null;
}

export interface TheologicalPositionResult {
  topic: string;
  calvary_chapel_position: string;
  positions: TheologicalPositionEntry[];
  consensus: string;
  dissenting_views: string | null;
  key_scriptures: string[];
  markdown: string;
}

// ─── MCP tool input schemas ───────────────────────────────────────────────────

export interface VerseCommentaryInput {
  book: string;
  chapter: number;
  verse_start: number;
  verse_end?: number | null;
  depth?: "concise" | "standard" | "deep";
  include_cross_references?: boolean;
  include_word_studies?: boolean;
  format?: "json" | "markdown" | "both";
}

export interface PassageOutlineInput {
  book: string;
  chapter: number;
  verse_start?: number;
  verse_end?: number | null;
}

export interface TheologicalPositionInput {
  topic: string;
}
