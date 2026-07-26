import { requireContext } from "@/lib/server-auth";
import Sidebar from "@/components/dash/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { ToastProvider } from "@/components/Toast";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireContext();
  return (
    <ToastProvider>
    <div className="flex min-h-dvh bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <Sidebar orgName={ctx.orgName} userEmail={ctx.user.email} />
      <main className="flex-1 overflow-x-hidden">
        <div className="flex items-center justify-end gap-3 border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
          <ThemeToggle />
        </div>
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
    </ToastProvider>
  );
}