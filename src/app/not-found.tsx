import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="gradient-text text-8xl font-black">404</p>
      <h1 className="mt-6 text-2xl font-extrabold text-zinc-900 dark:text-white">
        الصفحة غير موجودة
      </h1>
      <p className="mt-4 max-w-md leading-8 text-zinc-600 dark:text-zinc-400">
        الرابط الذي تحاول الوصول إليه غير موجود أو تم حذفه. يمكنك العودة إلى الصفحة الرئيسية أو تصفح
        جميع المقالات.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">الصفحة الرئيسية</Link>
        <Link href="/posts" className="btn-ghost">جميع المقالات</Link>
      </div>
    </div>
  );
}
