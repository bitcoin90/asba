import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: { default: "لوحة التحكم", template: "%s | ASBA AI" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // حماية من جهة الخادم: أي وصول إلى صفحات اللوحة يتطلب جلسة صحيحة
  const store = await cookies();
  const session = await verifySession(store.get("asba_session")?.value);
  if (!session) redirect("/admin/login");

  return <AdminShell username={session.u}>{children}</AdminShell>;
}
