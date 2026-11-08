import { describe, it, expect } from "vitest";
import { renderCampaignEmailHtml, renderCampaignEmailText, findSpamTriggerWords } from "@/lib/emailTemplateRenderer";

const baseTemplate = {
  subject: "Hello",
  preheader: "A quick note",
  headline: "Hello there",
  body_text: "First paragraph.\n\nSecond paragraph.",
  cta_text: "Get a quote",
  cta_url: "https://theuniquechoice.com/en#consultation",
};

describe("renderCampaignEmailHtml", () => {
  it("includes the headline, both paragraphs, and the CTA", () => {
    const html = renderCampaignEmailHtml(baseTemplate, null);
    expect(html).toContain("Hello there");
    expect(html).toContain("First paragraph.");
    expect(html).toContain("Second paragraph.");
    expect(html).toContain("Get a quote");
    expect(html).toContain("https://theuniquechoice.com/en#consultation");
  });

  it("escapes HTML-significant characters in user-authored fields", () => {
    const html = renderCampaignEmailHtml({ ...baseTemplate, headline: "<script>alert(1)</script>" }, null);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("omits the CTA block entirely when cta_text or cta_url is missing", () => {
    const html = renderCampaignEmailHtml({ ...baseTemplate, cta_url: null }, null);
    expect(html).not.toContain("Get a quote");
  });

  it("renders an Unsubscribe link only when a URL is given", () => {
    const withLink = renderCampaignEmailHtml(baseTemplate, "https://theuniquechoice.com/unsubscribe?t=abc");
    expect(withLink).toContain("Unsubscribe");
    expect(withLink).toContain("https://theuniquechoice.com/unsubscribe?t=abc");

    const withoutLink = renderCampaignEmailHtml(baseTemplate, null);
    expect(withoutLink).not.toContain("Unsubscribe");
  });
});

describe("renderCampaignEmailText", () => {
  it("produces a plain-text equivalent with the CTA and footer", () => {
    const text = renderCampaignEmailText(baseTemplate, "https://theuniquechoice.com/unsubscribe?t=abc");
    expect(text).toContain("Hello there");
    expect(text).toContain("First paragraph.");
    expect(text).toContain("Get a quote: https://theuniquechoice.com/en#consultation");
    expect(text).toContain("Unsubscribe: https://theuniquechoice.com/unsubscribe?t=abc");
  });

  it("omits the unsubscribe line when no URL is given", () => {
    const text = renderCampaignEmailText(baseTemplate, null);
    expect(text).not.toContain("Unsubscribe:");
  });
});

describe("findSpamTriggerWords", () => {
  it("flags known spam-trigger phrases case-insensitively", () => {
    expect(findSpamTriggerWords("ACT NOW for a limited time only!")).toEqual(
      expect.arrayContaining(["act now", "limited time only"])
    );
  });

  it("returns an empty array for clean copy", () => {
    expect(findSpamTriggerWords("Here's an update on your order.")).toEqual([]);
  });
});
