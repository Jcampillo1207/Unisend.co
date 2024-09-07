import { createClient } from "@/lib/supabase/server";
import { HeaderLanding } from "./_components/header-landing";

const LandingLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <main>
      <HeaderLanding user={user} />
      {children}
    </main>
  );
};

export default LandingLayout;
