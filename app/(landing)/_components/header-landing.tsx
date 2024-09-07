import { Button } from "@/components/ui/button";
import { LogoMailBase } from "@/components/ui/vector/logos";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { User } from "@supabase/supabase-js";

export const HeaderLanding = ({ user }: { user: User | null }) => {
  return (
    <header className="w-full h-14 min-h-14 shrink-0 items-center justify-between px-5 md:px-7 lg:px-14 xl:px-36 2xl:px-48 py-3 flex border-b">
      <Link
        href={"/"}
        className="h-full w-fit items-center justify-start flex gap-x-2"
      >
        <LogoMailBase className="h-5 w-auto" />
        <h1 className="text-xl font-bold">Unisend.co</h1>
      </Link>
      <div className="w-fit items-center h-full flex gap-x-1.5">
        {(!user && (
          <>
            <Button
              variant={"ghost"}
              size={"default"}
              asChild
              className="rounded-full"
            >
              <Link href={"/login"}>Inicia sesión</Link>
            </Button>
            <Button
              asChild
              variant="default"
              size={"default"}
              className="rounded-full bg-foreground text-background font-semibold flex gap-x-1.5 hover:bg-foreground/80"
            >
              <Link href={"/register"}>
                Comienza
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </>
        )) || (
          <>
            <Button
              variant={"default"}
              size={"default"}
              className="rounded-full bg-foreground text-background font-semibold flex gap-x-1.5 hover:bg-foreground/80"
            >
              <Link href={"/mailing"}>Mi mail</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
};
