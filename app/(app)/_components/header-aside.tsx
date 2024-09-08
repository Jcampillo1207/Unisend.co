import { LogoMailBase } from "@/components/ui/vector/logos";
import Link from "next/link";

export const HeaderAside = () => {
  return (
    <header className="w-full h-14 min-h-14 shrink-0 items-center justify-between flex border-b px-5 sticky top-0 left-0 bg-background">
      <div className="w-fit h-full items-center justify-start flex gapx-1">
        <Link
          href={"/"}
          className="h-full items-center justify-start flex gap-x-2"
        >
          <LogoMailBase className="h-5 w-auto" />
          <h1 className="text-xl font-bold">Unisend.co</h1>
        </Link>
      </div>
    </header>
  );
};
