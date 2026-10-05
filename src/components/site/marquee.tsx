export function Marquee({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  const repeats = Math.max(1, Math.ceil(12 / items.length));
  const row = Array.from({ length: repeats }, () => items)
    .flat()
    .map((name, i) => ({ id: `${i}-${name}`, name }));

  return (
    <div
      className="marquee overflow-hidden border-y border-line py-5"
      aria-hidden="true"
    >
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {row.map((item) => (
              <li
                key={`${copy}-${item.id}`}
                className="flex items-center whitespace-nowrap text-3xl font-semibold tracking-tight md:text-5xl"
              >
                <span className="px-6 md:px-10">{item.name}</span>
                <span className="text-block-yellow">✦</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
