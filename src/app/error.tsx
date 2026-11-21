"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-black text-zinc-300 dark:text-zinc-700">عذرًا</p>
      <h1 className="mt-4 text-xl font-extrabold text-zinc-800 dark:text-zinc-200">
        حدث خطأ غير متوقع أثناء عرض الصفحة
      </h1>
      <p className="mt-3 text-sm text-zinc-500">
        قد يكون الاتصال بقاعدة البيانات متقطعًا. جرّب مرة أخرى.
      </p>
      <button onClick={reset} className="btn-primary mt-6">إعادة المحاولة</button>
    </div>
  );
}
