import { redirect } from "next/navigation";
import { AsideMailing } from "./_components/aside";
import { createClient } from "@/lib/supabase/server";
import { NavAside } from "./_components/nav-aside";

export default async function MailingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: accountsData, error: accountsError } = await supabase
    .from("email_accounts")
    .select("*")
    .eq("user_id", user!.id)
    .order("principal", { ascending: false });

  return (
    <main className="w-full items-start justify-start flex max-h-dvh min-h-dvh h-dvh overflow-hidden">
      <NavAside user={user!} accounts={accountsData} />
      <AsideMailing user_id={user!.id} />
      {children}
    </main>
  );
}
