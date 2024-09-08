import { createClient } from "@/lib/supabase/server";
import { FooterOnboarding } from "./_components/footer-onboarding";
import { redirect } from "next/navigation";

const OnboardingLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="w-full h-dvh max-h-dvh min-h-dvh overflow-x-hidden overflow-y-scroll relative items-center justify-center flex flex-col">
      {children}
      <FooterOnboarding user_id={user!.id} />
    </main>
  );
};

export default OnboardingLayout;
