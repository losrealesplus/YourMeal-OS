import { describe, expect, it } from 'vitest';
import { build } from 'vite';
import { resolve } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';

describe('Vite rollback compilation contract', () => {
  it.each([undefined, 'false', 'true'])('embeds flag %s without runtime activation', async (flag) => {
    const root = await mkdtemp(resolve(tmpdir(), 'rollback-build-'));
    const previous = process.env.VITE_OPERATIONAL_ROLLBACK_ENABLED;
    try {
      if (flag === undefined) delete process.env.VITE_OPERATIONAL_ROLLBACK_ENABLED;
      else process.env.VITE_OPERATIONAL_ROLLBACK_ENABLED = flag;
      const result = await build({ configFile: false, root, envDir: false, logLevel: 'silent',
        define: { 'process.env.NODE_ENV': JSON.stringify('production') },
        build: { write: false, minify: false, lib: {
          entry: resolve(process.cwd(), 'src/modules/operations/domain/operational-status.ts'), formats: ['es'],
        } },
      });
      const output = Array.isArray(result) ? result[0].output : (result as any).output;
      const code = output.find((x: any) => x.type === 'chunk').code;
      // Evaluates only the compiled library in memory; no deployment or application flag is changed.
      delete process.env.VITE_OPERATIONAL_ROLLBACK_ENABLED;
      const compiled = await import(/* @vite-ignore */ 'data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
      expect(compiled.isOperationalRollbackEnabled()).toBe(flag === 'true');
    } finally {
      if (previous === undefined) delete process.env.VITE_OPERATIONAL_ROLLBACK_ENABLED;
      else process.env.VITE_OPERATIONAL_ROLLBACK_ENABLED = previous;
      await rm(root, { recursive: true, force: true });
    }
  });
});
