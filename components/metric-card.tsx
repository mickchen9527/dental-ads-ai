type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
  tone?: "cyan" | "emerald" | "amber" | "slate";
};

const toneClasses = {
  cyan: "border-cyan-100 bg-cyan-50 text-cyan-800",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-800",
  amber: "border-amber-100 bg-amber-50 text-amber-900",
  slate: "border-slate-200 bg-white text-slate-700",
};

export function MetricCard({
  label,
  value,
  helper,
  tone = "slate",
}: MetricCardProps) {
  return (
    <article className={`rounded-md border p-4 ${toneClasses[tone]}`}>
      <p className="text-xs font-medium">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-600">{helper}</p>
    </article>
  );
}
