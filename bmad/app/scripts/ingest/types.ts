// ParsedEntry fields use snake_case to mirror the message_imports DB column
// names the parser output maps to (session_date, original_timestamp_raw, etc.).
// WriterConfig and ImportStats use camelCase as runtime TypeScript objects.

export type ParsedEntryBase = {
  author_raw: string;          // "Danny Bauman (via Meet)"
  author_display: string;      // "Danny Bauman"
  session_date: string;        // "2026-04-09" (YYYY-MM-DD)
  timestamp_raw: string;       // "Tue 3:54 PM" (original, preserved)
  timestamp_resolved: string;  // ISO 8601 with PT offset
};

export type MessageEntry = ParsedEntryBase & {
  kind: 'message';
  content: string;             // full multi-line message text
};

export type LinkEntry = ParsedEntryBase & {
  kind: 'link';
  content: string;             // the URL
  preview_title?: string;      // Gmail preview text if present
};

export type ParsedEntry = MessageEntry | LinkEntry;

export type WriterConfig = {
  source: string;              // e.g. 'google-meet-email'
  importBatchId: string;       // e.g. '2026-04-09-backfill'
  instructorDisplayNames: readonly string[];
  dryRun: boolean;
};

export type ImportStats = {
  ghostUsersCreated: number;
  ghostUsersMatched: number;
  sessionRootsCreated: number;
  sessionRootsReused: number;
  messagesInserted: number;
  messagesSkipped: number;
  galleryCardsInserted: number;
  galleryCardsDeduped: number;
  provenanceRows: number;
};
