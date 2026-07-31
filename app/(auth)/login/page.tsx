import AuthForm from "@/components/dash/AuthForm";

// noindex: a thin auth page adds nothing to search results and competes with
// the pages that do. robots.txt does not cover it, so say it in metadata.
export const metadata = { title: "Log in - ChatFlowGate", robots: { index: false, follow: true } };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="relative grid min-h-dvh place-items-center bg-black px-6 text-white">
      <div className="m-stripe absolute inset-x-0 top-0" />
      <AuthForm mode="login" showGoogle={!!process.env.GOOGLE_CLIENT_ID} />
    </main>
  );
}
