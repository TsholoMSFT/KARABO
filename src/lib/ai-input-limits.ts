const TRUNCATION_MARKER = "\n\n[Notes truncated to 16,000 characters for AI processing.]";

export function clipDiscoveryNotes(notes: string, maxChars = 16000): string {
  if (notes.length <= maxChars) return notes;
  return `${notes.slice(0, maxChars)}${TRUNCATION_MARKER}`;
}
