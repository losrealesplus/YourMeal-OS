/**
 * Simple recommendation list — no AI / Recovery.
 */

export function DoctorRecommendations({ items }: { items: string[] }) {
  const unique = [...new Set(items.filter(Boolean))];

  return (
    <section className="space-y-2">
      <h3 className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-500">
        Recommendations
      </h3>
      {unique.length === 0 ? (
        <p className="px-1 text-[11px] text-zinc-600">No recommendations.</p>
      ) : (
        <ul className="space-y-1.5">
          {unique.map((r) => (
            <li
              key={r}
              className="rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] text-zinc-300"
            >
              {r}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
