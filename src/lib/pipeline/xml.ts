/** Escapes the five XML special characters (text content and attribute values). */
export function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/**
 * Text that XML 1.0 can carry on one line: tabs and line breaks become a space; other control
 * characters, U+FFFE/U+FFFF and lone surrogates (illegal even as character references) are dropped.
 */
export function cleanText(s: string): string {
  return s.replace(/[\t\r\n]+/g, " ").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "");
}
