// Parses the raw tracking text an admin copies off a carrier's own tracking
// page (e.g. T6 Cross-border's TrackSearch) into individual timeline updates
// — so pasting the whole block fills in every row instead of retyping each
// one through the "Date/time" + "Description" fields by hand.
//
// Pure string logic, no Date objects — so it's safe to run in the browser
// (where the pasted timestamps are then interpreted as local time, exactly
// like the existing manual datetime-local inputs) without any server/client
// timezone mismatch.

export interface ParsedTrackingUpdate {
  /** "YYYY-MM-DDTHH:mm:ss" with no timezone — feed through the same
   * local-time interpretation as the manual datetime-local field. */
  localDateTime: string;
  description: string;
}

const LINE_START = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?\s*(.*)$/;

/** A line is "decoration" (a `====` divider, a blank line) if it has no
 * actual letters or digits once punctuation is stripped — those get
 * dropped rather than glued onto the previous update's description. */
function isDecorative(line: string): boolean {
  return !/[a-zA-Z0-9一-鿿]/.test(line);
}

export function parseTrackingUpdates(rawText: string): ParsedTrackingUpdate[] {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim());
  const updates: ParsedTrackingUpdate[] = [];
  let current: ParsedTrackingUpdate | null = null;

  for (const line of lines) {
    if (!line) continue;
    const match = line.match(LINE_START);
    if (match) {
      const [, date, time, seconds, rest] = match;
      current = { localDateTime: `${date}T${time}:${seconds ?? "00"}`, description: rest.trim() };
      updates.push(current);
      continue;
    }
    // A carrier's page sometimes soft-wraps a long update across what
    // copies as two lines — reattach that continuation instead of
    // treating it as a new, timestamp-less entry. Lines before the first
    // timestamp (a "Waybill No: ..." header block) have no `current` yet
    // and are correctly dropped here.
    if (current && !isDecorative(line)) {
      current.description = current.description ? `${current.description} ${line}` : line;
    }
  }

  return updates.filter((u) => u.description.length > 0);
}
