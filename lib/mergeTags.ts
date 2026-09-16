// Pure string substitution — no DB or env access, so this is safe to
// import from both server code (the actual send) and a client component
// (a live "here's what this looks like" preview in the template editor).

export interface MergeTagContext {
  email: string;
  name: string | null;
}

export const MERGE_TAGS: { tag: string; description: string }[] = [
  { tag: "{{first_name}}", description: "Recipient's first name — falls back to \"there\" when no name is on file (e.g. newsletter signups)." },
  { tag: "{{name}}", description: "Recipient's full name — same fallback as {{first_name}}." },
  { tag: "{{email}}", description: "Recipient's email address — always available." },
];

function firstNameOf(name: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0];
}

const TAG_PATTERN = /\{\{\s*(first_name|name|email)\s*\}\}/gi;

export function applyMergeTags(text: string, ctx: MergeTagContext): string {
  const values: Record<string, string> = {
    first_name: firstNameOf(ctx.name),
    name: ctx.name?.trim() || "there",
    email: ctx.email,
  };
  return text.replace(TAG_PATTERN, (_match, key: string) => values[key.toLowerCase()] ?? "");
}
