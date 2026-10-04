// Inline, synchronous, pre-hydration script — reads the saved theme and sets
// data-theme on <html> BEFORE paint, so there's no flash-of-wrong-theme.
// Deliberately not a React component: it has to run before React even loads.
const THEME_SCRIPT = `
(function () {
  try {
    var saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") {
      document.documentElement.setAttribute("data-theme", saved);
    }
    // "system" (or unset) — no attribute, globals.css media query handles it.
  } catch (e) {}
})();
`;

export function ThemeScript() {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: static string we wrote above, no user input
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
