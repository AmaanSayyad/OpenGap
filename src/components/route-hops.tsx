import { hopHref, isMeteora, type RouteHop } from "@/lib/routes";

export function RouteHops({
  hops,
  loading,
}: {
  hops: RouteHop[];
  loading?: boolean;
}) {
  if (loading && !hops.length) {
    return <p className="text-sm text-muted-foreground">Finding a Jupiter route…</p>;
  }
  if (!hops.length) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">
        Jupiter route · {hops.some(isMeteora) ? "uses Meteora" : "on-chain venues"}
      </p>
      <ol className="flex flex-wrap gap-2">
        {hops.map((hop) => (
          <li key={`${hop.ammKey}-${hop.label}`}>
            <a
              href={hopHref(hop)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs hover:bg-muted"
            >
              <span className="font-medium">{hop.label}</span>
              {hop.percent ? (
                <span className="font-mono text-muted-foreground">{hop.percent}%</span>
              ) : null}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
