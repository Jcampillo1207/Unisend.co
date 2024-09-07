import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HeaderAuth } from "./_components/header-auth";

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="w-full h-dvh max-h-dvh min-h-dvh overflow-x-hidden overflow-y-scroll relative">
      <HeaderAuth />
      {children}
    </main>
  );
};

export default AuthLayout;
