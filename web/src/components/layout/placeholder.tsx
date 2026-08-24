export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="border-b border-edge px-4 py-5 lg:px-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </div>
  );
}

export function Placeholder({
  title,
  note,
}: {
  title: string;
  note?: string;
}) {
  return (
    <>
      <PageHeader title={title} />
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-24 text-center">
        <span aria-hidden className="text-3xl opacity-40">▦</span>
        <p className="text-sm text-muted">{note ?? "Halaman ini belum diimplementasikan."}</p>
      </div>
    </>
  );
}
