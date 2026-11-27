import DOMPurify from "dompurify";
import { useMemo } from "react";

const BLOCK_END = /<\/(p|h[1-6]|li|div|blockquote)>|<br\s*\/?>/gi;
const HEADING = /<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi;

export const sanitizeHtml = (html = "") => DOMPurify.sanitize(html);

export function htmlToText(html = "", { skipHeadings = false } = {}) {
  let src = sanitizeHtml(html);
  if (skipHeadings) src = src.replace(HEADING, " ");
  const doc = new DOMParser().parseFromString(
    src.replace(BLOCK_END, "$& "),
    "text/html",
  );
  return doc.body.textContent.replace(/\s+/g, " ").trim();
}

export function RichText({ html }) {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div className="rich-text" dangerouslySetInnerHTML={{ __html: clean }} />
  );
}

export function RichTextPreview({ html, lines = 2 }) {
  const text = useMemo(() => htmlToText(html, { skipHeadings: true }), [html]);
  if (!text) return null;
  return (
    <div className="rich-text-preview" style={{ WebkitLineClamp: lines }}>
      {text}
    </div>
  );
}
