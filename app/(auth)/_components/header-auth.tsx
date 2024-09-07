import { LogoMailBase } from "@/components/ui/vector/logos";
import Link from "next/link";

export const HeaderAuth = () => {
  return (
    <header className="w-full h-14 min-h-14 shrink-0 items-center justify-between px-5 md:px-7 lg:px-14 xl:px-36 2xl:px-48 py-3 flex border-b">
      <Link
        href={"/"}
        className="h-full items-center justify-start flex gap-x-2"
      >
        <LogoMailBase className="h-5 w-auto" />
        <h1 className="text-xl font-bold">Unisend.co</h1>
      </Link>
    </header>
  );
};
