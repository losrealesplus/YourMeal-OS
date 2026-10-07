import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { strictJson } from "./contract.mjs";
export async function store(path, operation, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "/usr/bin/python3",
      [fileURLToPath(new URL("./store.py", import.meta.url))],
      {
        env: { PATH: "/usr/bin:/bin" },
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    let output = "";
    let errors = "";
    child.stdout.on("data", (b) => {
      output += b;
    });
    child.stderr.on("data", (b) => {
      errors += b;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      try {
        if (!output) throw new Error(`STORE_TRANSPORT_LOST:${code}`);
        const parsed = strictJson(output);
        if (code !== 0 || !parsed.ok) throw new Error(parsed.error ?? errors);
        resolve(parsed.result);
      } catch (e) {
        reject(e);
      }
    });
    child.stdin.end(JSON.stringify({ path, operation, args }));
  });
}
