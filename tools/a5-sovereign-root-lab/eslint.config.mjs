import js from "@eslint/js";
import globals from "globals";
export default [
  {
    files: ["**/*.mjs"],
    ...js.configs.recommended,
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: globals.node },
  },
  { files: ["**/ui.mjs", "**/ui-browser.spec.mjs"], languageOptions: { globals: globals.browser } },
];
