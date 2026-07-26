import { requireContext } from "@/lib/server-auth";
import DashShell from "@/components/dash/DashShell";
import { ToastProvider } from "@/components/Toast";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireContext();
  return (
    <ToastProvider>
      <DashShell orgName={ctx.orgName} userEmail={ctx.user.email}>
        {children}
      </DashShell>
    </ToastProvider>
  );
}
