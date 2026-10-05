// Inline, synchronous, pre-hydration script — membaca tema tersimpan dan mengatur
// data-theme di <html> SEBELUM paint, supaya tidak ada flash tema yang salah.
// Default (belum ada pilihan) = terang. "system" = tanpa atribut, media query
// di globals.css yang menentukan.
const THEME_SCRIPT = `
(function () {
  try {
    var saved = localStorage.getItem("theme");
    if (saved === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", saved === "dark" ? "dark" : "light");
    }
  } catch (e) {}
})();
`;

export function ThemeScript() {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: static string we wrote above, no user input
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
