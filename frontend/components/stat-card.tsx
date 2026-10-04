export function StatCard({
  title,
  value,
  positive
}: {
  title: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p
        className={`mt-2 text-2xl font-bold ${
          positive ? 'text-emerald-600' : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}
