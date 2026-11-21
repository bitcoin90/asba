import Link from "next/link";

export default function Pagination({
  page,
  total,
  perPage,
  basePath,
}: {
  page: number;
  total: number;
  perPage: number;
  basePath: string;
}) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;

  const nums: number[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 2) nums.push(i);
  }

  const href = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="التنقل بين الصفحات">
      {page > 1 && (
        <Link href={href(page - 1)} className="btn-ghost !px-4 !py-2">
          السابق
        </Link>
      )}
      {nums.map((n, idx) => (
        <span key={n} className="flex items-center gap-2">
          {idx > 0 && n - nums[idx - 1] > 1 && <span className="text-zinc-400">…</span>}
          <Link
            href={href(n)}
            className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-bold transition-all ${
              n === page
                ? "text-white shadow-soft"
                : "border border-zinc-200 bg-white text-zinc-600 hover:border-[var(--brand)] hover:text-[var(--brand)] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            }`}
            style={n === page ? { backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-2))" } : undefined}
          >
            {n}
          </Link>
        </span>
      ))}
      {page < pages && (
        <Link href={href(page + 1)} className="btn-ghost !px-4 !py-2">
          التالي
        </Link>
      )}
    </nav>
  );
}
