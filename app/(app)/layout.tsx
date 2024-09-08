import { redirect } from "next/navigation";
import { AsideMailing } from "./_components/aside";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <main className="w-full items-start justify-start flex max-h-dvh min-h-dvh h-dvh overflow-hidden">
      <AsideMailing user_id={user!.id} />
      {children}
    </main>
  );
}
