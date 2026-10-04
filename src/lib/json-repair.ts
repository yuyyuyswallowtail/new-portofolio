/**
 * Parse JSON dari LLM. Kalau gagal karena backslash liar di dalam string
 * (mis. "\p" atau "\d" dari kode/regex), perbaiki lalu coba lagi.
 */
export function parseArticleJson<T>(raw: string): T {
  const text = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    return JSON.parse(text) as T;
  } catch {
    // escape valid dipertahankan, backslash lain digandakan
    const fixed = text.replace(
      /\\(["\\/bfnrt]|u[0-9a-fA-F]{4})|\\/g,
      (match, valid) => (valid ? match : "\\\\"),
    );
    return JSON.parse(fixed) as T;
  }
}
