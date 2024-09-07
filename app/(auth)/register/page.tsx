import { LogoMailBase } from "@/components/ui/vector/logos";
import { RegisterForm } from "./_components/register-form";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const RegisterPage = () => {
  return (
    <main className="w-full h-auto min-h-[calc(100dvh_-_3.5rem)] max-h-[calc(100dvh_-_3.5rem)] overflow-hidden flex flex-col items-center justify-center gap-y-2 px-5 md:px-7 lg:px-14 xl:px-36 2xl:px-48">
      <div className="w-full items-center flex flex-col justify-center gap-y-1 mb-5">
        <div className="h-fit items-center justify-start flex gap-x-2">
          <LogoMailBase className="h-10 w-auto" />
          <h1 className="text-xl lg:text-2xl font-bold">Unisend.co</h1>
        </div>
      </div>
      <RegisterForm />
      <span className="w-full max-w-lg items-center justify-end gap-x-2 flex px-5">
        <Button
          asChild
          variant={"link"}
          size={"default"}
          className="py-0 px-0 text-muted-foreground hover:text-foreground flex gap-x-1"
        >
          <Link href={"/login"}>
            Ya tengo una cuenta
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </span>
    </main>
  );
};

export default RegisterPage;
