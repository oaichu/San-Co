/** Markdown siêu nhẹ: **bold**, *italic*, - list, đoạn văn. Không HTML. */
export function Md({ text }: { text: string }) {
  const paras = text.split(/\n\n+/);
  return (
    <div className="space-y-4">
      {paras.map((p, i) => {
        const lines = p.split("\n");
        if (lines.every((l) => l.trimStart().startsWith("- "))) {
          return (
            <ul key={i} className="list-none space-y-2.5">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-2.5 text-[15px] leading-[1.7] text-ink-2">
                  <span className="mt-[0.65em] h-1.5 w-1.5 shrink-0 rounded-full bg-vermilion" />
                  <span><Inline t={l.trimStart().slice(2)} /></span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-[15px] leading-[1.75] text-ink-2">
            {lines.map((l, j) => (
              <span key={j}><Inline t={l} />{j < lines.length - 1 && <br />}</span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function Inline({ t }: { t: string }) {
  const parts = t.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-semibold text-ink">{p.slice(2, -2)}</strong>;
        if (p.startsWith("*") && p.endsWith("*")) return <em key={i}>{p.slice(1, -1)}</em>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}
