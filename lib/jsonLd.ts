/**
 * Safe serializer for JSON-LD `<script>` blocks rendered via
 * `dangerouslySetInnerHTML`. Plain `JSON.stringify` does NOT escape `<` —
 * if any admin-authored field ever contains the literal string
 * `</script>` (a blog post body, a glossary definition, an FAQ answer),
 * it closes the script tag early and everything after it renders as raw
 * HTML, which can execute arbitrary injected markup/script. Escaping `<`
 * to its unicode form breaks that sequence while staying valid inside a
 * JSON string, so the payload round-trips through JSON.parse unchanged.
 */
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
