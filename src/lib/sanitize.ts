// Sanitasi konten HTML artikel (server-side) — dipakai sebelum menyimpan artikel.
// Allowlist ketik: tag & atribut editor (Tiptap) saja.

import sanitizeHtml from "sanitize-html";

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr", "h1", "h2", "h3", "h4", "strong", "b", "em", "i", "u",
    "s", "blockquote", "ul", "ol", "li", "a", "img", "figure", "figcaption",
    "code", "pre", "span", "div", "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    span: ["class"],
    div: ["class"],
    figure: ["class"],
    figcaption: ["class"],
    p: ["class"],
    h1: ["class"], h2: ["class"], h3: ["class"], h4: ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, rel: "noopener noreferrer nofollow", target: "_blank" },
    }),
  },
  // Batasi ukuran konten masuk
  allowedSchemesByTag: { img: ["http", "https"], a: ["http", "https", "mailto"] },
  exclusiveFilter: (frame) => {
    // Buang img dengan src bukan http(s) (mis. javascript: atau data:)
    if (frame.tag === "img") {
      const src = frame.attribs.src ?? "";
      return !/^https?:\/\//i.test(src);
    }
    return false;
  },
};

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, {
    ...OPTIONS,
    nonTextTags: ["style", "script", "textarea", "noscript", "iframe", "object", "embed"],
  });
}
