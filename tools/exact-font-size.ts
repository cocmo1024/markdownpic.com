import type { Plugin } from "vite";

/**
 * html-to-image 1.11 copies each element's computed style into the export clone, but rewrites
 * every pixel font size to `floor(size) - 0.1px` (20.5px becomes 19.9px). Exports then use
 * smaller text than the preview, so lines break differently and the fit checks measure a layout
 * that is not the one drawn. This removes that one rewrite so the export matches the preview.
 *
 * The build fails if the code is not found, so a library update cannot silently undo the fix.
 */
const FILE = /html-to-image[\\/](es|lib)[\\/]clone-node\.js$/;
const REWRITE = /if \(name === 'font-size' && value\.endsWith\('px'\)\) \{\s*(?:const|var) reducedFont = [^;]+;\s*value = [^;]+;\s*\}/;

export function exactFontSize(): Plugin {
  return {
    name: "markdownpic:exact-font-size",
    enforce: "pre",
    transform(code, id) {
      if (!FILE.test(id.split("?")[0])) return;
      if (!REWRITE.test(code)) this.error("html-to-image changed: the font-size rewrite was not found in " + id + ". Check tools/exact-font-size.ts.");
      return { code: code.replace(REWRITE, "/* font sizes are copied exactly (tools/exact-font-size.ts) */"), map: null };
    },
  };
}
