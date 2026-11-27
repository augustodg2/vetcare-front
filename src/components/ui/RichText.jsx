import DOMPurify from "dompurify";
import { useMemo } from "react";

const BLOCK_END = /<\/(p|h[1-6]|li|div|blockquote)>|<br\s*\/?>/gi;
const BREAK = String.fromCharCode(0x2063);
const HEADING = /<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi;

export const sanitizeHtml = (html = "") => DOMPurify.sanitize(html);

export function htmlToText(html = "", { skipHeadings = false } = {}) {
  let src = sanitizeHtml(html);
  if (skipHeadings) src = src.replace(HEADING, " ");
  const doc = new DOMParser().parseFromString(
    src.replace(BLOCK_END, `$&${BREAK}`),
    "text/html",
  );
  return doc.body.textContent
    .split(BREAK)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" · ");
}

export function RichText({ html }) {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div className="rich-text" dangerouslySetInnerHTML={{ __html: clean }} />
  );
}
