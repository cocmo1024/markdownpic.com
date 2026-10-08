/**
 * Batch generation: one image per row of a table. The current page is the template; {{column}}
 * placeholders are filled from each row. Tables come from a spreadsheet paste (tab separated)
 * or a CSV/TSV file.
 */
export const MAX_BATCH_ROWS = 100;

/** Parses delimited text (tab, comma or semicolon, detected) with RFC 4180 quoting. */
export function parseTable(text: string): string[][] {
  const source = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const firstLine = source.split("\n", 1)[0] ?? "";
  const delimiter = firstLine.includes("\t") ? "\t" : (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === "\"" && source[i + 1] === "\"") { cell += "\""; i++; }
      else if (char === "\"") quoted = false;
      else cell += char;
    } else if (char === "\"" && cell === "") quoted = true;
    else if (char === delimiter) { row.push(cell); cell = ""; }
    else if (char === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.map(cells => cells.map(value => value.trim())).filter(cells => cells.some(Boolean));
}

const key = (name: string) => name.trim().toLowerCase();
const PLACEHOLDER = /\{\{\s*([^{}]+?)\s*\}\}/g;

/** Placeholder names used in a template, in order of first appearance. */
export function placeholdersIn(template: string) {
  return [...new Set([...template.matchAll(PLACEHOLDER)].map(match => match[1].trim()))];
}

export interface BatchPlan { headers: string[]; records: Array<Record<string, string>>; usesHeader: boolean; missing: string[]; truncated: boolean }

/**
 * Turns parsed rows into records. The first row is a header when it names any placeholder;
 * otherwise columns are available as {{1}}, {{2}}… and the first column as {{text}}.
 */
export function planBatch(rows: string[][], template: string): BatchPlan {
  const wanted = placeholdersIn(template).map(key).filter(name => name !== "n" && name !== "total");
  const first = rows[0] ?? [];
  const usesHeader = wanted.length > 0 && first.some(cell => wanted.includes(key(cell)));
  const headers = usesHeader ? first : first.map((_, i) => String(i + 1));
  const body = (usesHeader ? rows.slice(1) : rows);
  const records = body.slice(0, MAX_BATCH_ROWS).map(cells => {
    const record: Record<string, string> = {};
    headers.forEach((header, i) => { record[key(header)] = cells[i] ?? ""; });
    if (!usesHeader) record.text = cells.filter(Boolean).join("\n\n");
    return record;
  });
  const known = new Set([...headers.map(key), ...(usesHeader ? [] : ["text"])]);
  return { headers, records, usesHeader, missing: wanted.filter(name => !known.has(name)), truncated: body.length > MAX_BATCH_ROWS };
}

/** Fills one record into the template. Without placeholders, the row itself is the content. */
export function fillTemplate(template: string, record: Record<string, string>, index: number, total: number) {
  if (!placeholdersIn(template).length) return record.text ?? Object.values(record).join("\n\n");
  return template.replace(PLACEHOLDER, (_, name: string) => {
    const field = key(name);
    if (field === "n") return String(index + 1);
    if (field === "total") return String(total);
    return record[field] ?? "";
  });
}
