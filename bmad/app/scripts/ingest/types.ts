export type ParsedEntry = {
  kind: 'message' | 'link';
  author_raw: string;          // "Danny Bauman (via Meet)"
  author_display: string;      // "Danny Bauman"
  session_date: string;        // "2026-04-09" (YYYY-MM-DD)
  timestamp_raw: string;       // "Tue 3:54 PM" (original, preserved)
  timestamp_resolved: string;  // ISO 8601 with PT offset
  content: string;             // full multi-line for messages; URL for links
  preview_title?: string;      // Gmail preview text if present (links only)
};

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
