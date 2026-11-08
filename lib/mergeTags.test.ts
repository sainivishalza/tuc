import { describe, it, expect } from "vitest";
import { applyMergeTags } from "@/lib/mergeTags";

describe("applyMergeTags", () => {
  it("substitutes first_name, name, and email", () => {
    const ctx = { email: "alex@example.com", name: "Alex Rivera" };
    expect(applyMergeTags("Hi {{first_name}}, this is {{name}} at {{email}}.", ctx)).toBe(
      "Hi Alex, this is Alex Rivera at alex@example.com."
    );
  });

  it("falls back to 'there' for first_name and name when no name is on file", () => {
    const ctx = { email: "a@b.com", name: null };
    expect(applyMergeTags("Hi {{first_name}} / {{name}}", ctx)).toBe("Hi there / there");
  });

  it("is case-insensitive and tolerates inner whitespace in the tag", () => {
    const ctx = { email: "a@b.com", name: "Sam" };
    expect(applyMergeTags("{{ FIRST_NAME }} {{Name}}", ctx)).toBe("Sam Sam");
  });

  it("leaves text with no tags unchanged", () => {
    const ctx = { email: "a@b.com", name: "Sam" };
    expect(applyMergeTags("No tags here.", ctx)).toBe("No tags here.");
  });

  it("leaves an unrecognized tag-like pattern untouched", () => {
    const ctx = { email: "a@b.com", name: "Sam" };
    expect(applyMergeTags("{{unknown_tag}}", ctx)).toBe("{{unknown_tag}}");
  });
});
