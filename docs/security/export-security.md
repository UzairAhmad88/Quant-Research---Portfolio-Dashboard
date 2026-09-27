# Export Security & Sanitization

The export module allows analysts to download structured research datasets in CSV, JSON, and PDF formats.

---

## 1. Path Traversal Defense

- Filename generation is fully controlled by the server.
- `sanitize_filename(name: str)` strips null bytes (`\x00`), path separators (`/`, `\\`, `:`), and directory traversal tokens (`..`):
  ```python
  def sanitize_filename(name: str) -> str:
      cleaned = re.sub(r'[\x00/\\:]', '_', name)
      cleaned = re.sub(r'\.{2,}', '_', cleaned)
      cleaned = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', cleaned)
      cleaned = re.sub(r'_+', '_', cleaned)
      return cleaned.strip('._') or "export"
  ```
- Exports are generated directly in-memory as byte streams and returned via `StreamingResponse` with clean `Content-Disposition` headers. No arbitrary local file paths are accepted or written.

---

## 2. CSV Formula Injection Defense (OWASP DDE / Formula Injection)

When CSV files are opened in Microsoft Excel or Google Sheets, cells starting with formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`) can execute remote code or exfiltrate data.
- The `CSVExporter` evaluates cell contents:
  - Numeric values (`float`, `int`) and negative numbers (e.g., `-0.05` return) are rendered as standard numbers.
  - Text strings starting with formula triggers are prepended with a single quote (`'`), neutralizing spreadsheet formula execution while preserving visual text clarity.
