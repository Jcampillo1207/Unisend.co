"use client";

import { Button } from "@/components/ui/button";
import { Database } from "@/database.types";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const routeOrder = [
  {
    path: "/welcome",
    order: 0,
    name: "Bienvenid@",
  },
  {
    path: "/explain",
    order: 1,
    name: "¿Cómo funciona?",
  },
  {
    path: "/setup",
    order: 2,
    name: "Configuración",
  },
  {
    path: "/onboarding",
    order: 3,
    name: "Onboarding",
  },
];

const supabase = createClient();
export const FooterOnboarding = ({
  user_id,
}: {
  user_id: Database["public"]["Tables"]["email_accounts"]["Row"]["user_id"];
}) => {
  const pathname = usePathname();
  const currentIndex = routeOrder.findIndex((r) => r.path === pathname);
  const isLastRoute = currentIndex === routeOrder.length - 1;
  const isFirstRoute = currentIndex === 0;
  const router = useRouter();

  async function getPrincipalEmail() {
    const { data, error } = await supabase
      .from("email_accounts")
      .select("access_token, email")
      .eq("principal", true)
      .eq("user_id", user_id)
      .single();

    if (error) {
      console.error(error);
    } else {
      router.push(`mailing?emailroute=${data.email}`);
    }
  }

  return (
    <footer className="w-full max-w-2xl items-center justify-between flex px-5 md:px-7 lg:px-0 mt-5">
      <Button variant={"outline"} size={"sm"} className="rounded-full" asChild>
        <Link href={isFirstRoute ? "/" : routeOrder[currentIndex - 1].path}>
          <ArrowLeft className="size-3 mr-1" />
          {isFirstRoute ? "Salir" : "Regresar"}
        </Link>
      </Button>
      {(!isLastRoute && (
        <Button
          variant={"outline"}
          size={"sm"}
          className="rounded-full hover:bg-primary/20 hover:text-primary"
          asChild
        >
          <Link href={routeOrder[currentIndex + 1].path}>
            Siguiente
            <ArrowRight className="size-3 ml-1" />
          </Link>
        </Button>
      )) || (
        <Button
          variant={"outline"}
          size={"sm"}
          className="rounded-full hover:bg-primary/20 hover:text-primary"
          onClick={getPrincipalEmail}
        >
          Ir a mi mail
          <ArrowRight className="size-3 ml-1" />
        </Button>
      )}
    </footer>
  );
};
