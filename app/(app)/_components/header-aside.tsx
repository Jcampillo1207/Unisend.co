"use client";

import { Button } from "@/components/ui/button";
import { LogoMailBase } from "@/components/ui/vector/logos";
import { ArrowLeft, ArrowRight, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const HeaderAside = () => {
  const router = useRouter();
  return (
    <header className="w-full h-14 min-h-14 shrink-0 items-center justify-between flex border-b px-5 sticky top-0 left-0 z-20 bg-background">
      <div className="w-fit h-full items-center justify-start flex gapx-1">
        <Link
          href={"/"}
          className="h-full items-center justify-start flex gap-x-2"
        >
          <LogoMailBase className="h-5 w-auto" />
          <h1 className="text-xl font-bold">Unisend.co</h1>
        </Link>
      </div>
      <div className="w-fit items-center justify-end flex gap-x-0.5 h-full">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => location.reload()}
          className="rounded-lg text-muted-foreground hover:text-foreground"
        >
          <RefreshCcw className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground rounded-lg"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground rounded-lg"
          onClick={() => router.forward()}
        >
          <ArrowRight className="size-3" />
        </Button>
      </div>
    </header>
  );
};
