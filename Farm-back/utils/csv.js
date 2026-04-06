/**
 * Minimal CSV helpers (RFC-style quoting). No external deps.
 */

function escapeCsvCell(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** @param {string[][]} rows — first row = header */
function rowsToCsv(rows) {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}

/** Excel-friendly UTF-8 BOM */
function withUtf8Bom(csv) {
  return `\uFEFF${csv}`;
}

module.exports = { escapeCsvCell, rowsToCsv, withUtf8Bom };
