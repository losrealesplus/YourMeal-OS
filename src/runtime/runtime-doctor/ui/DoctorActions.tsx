/**
 * Doctor action bar — Run Again · Copy Report · Export JSON.
 */

export function DoctorActions({
  running,
  hasReport,
  copiedReport,
  copiedExport,
  onRun,
  onCopyReport,
  onExportJson,
}: {
  running: boolean;
  hasReport: boolean;
  copiedReport: boolean;
  copiedExport: boolean;
  onRun: () => void;
  onCopyReport: () => void;
  onExportJson: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-1 space-y-1.5 border-t border-white/10 bg-zinc-950/95 px-1 pt-2 backdrop-blur">
      <button
        type="button"
        disabled={running}
        onClick={onRun}
        className="w-full rounded-md bg-zinc-100 py-2 text-center text-[11px] font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {running ? "Running…" : hasReport ? "Run Again" : "Run Doctor"}
      </button>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          disabled={!hasReport}
          onClick={onCopyReport}
          className="rounded-md border border-white/10 py-1.5 text-[10px] font-medium text-zinc-300 hover:bg-white/5 disabled:opacity-40"
        >
          {copiedReport ? "Copied ✓" : "Copy Report"}
        </button>
        <button
          type="button"
          disabled={!hasReport}
          onClick={onExportJson}
          className="rounded-md border border-white/10 py-1.5 text-[10px] font-medium text-zinc-300 hover:bg-white/5 disabled:opacity-40"
        >
          {copiedExport ? "Exported ✓" : "Export JSON"}
        </button>
      </div>
    </div>
  );
}
