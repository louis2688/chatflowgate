import AuthForm from "@/components/dash/AuthForm";

export const metadata = { title: "Sign up - ChatFlowGate" };
export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <main className="relative grid min-h-dvh place-items-center bg-black px-6 text-white">
      <div className="m-stripe absolute inset-x-0 top-0" />
      <AuthForm mode="signup" showGoogle={!!process.env.GOOGLE_CLIENT_ID} />
    </main>
  );
}
