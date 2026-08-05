/**
 * Developer Platform · CLI entry alias.
 * Delegates to index.mjs.
 */
import { main } from "./index.mjs";

main().then((code) => process.exit(code));
