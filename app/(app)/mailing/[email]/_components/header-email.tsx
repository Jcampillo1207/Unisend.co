"use client";

import { Button } from "@/components/ui/button";
import { Reply } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export const HeaderEmail = ({
  emailId,
  userId,
}: {
  emailId: string;
  userId: string;
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  return (
    <>
      <div className="w-full h-14 items-center justify-between flex px-4 border-b bg-background shrink-0 min-h-14 sticky top-0 left-0 z-10">
         <h1 className="text-base font-semibold">Mensaje</h1>
        <div className="w-fit h-full items-center justify-center flex gap-x-1.5">
          <Button
            variant={"default"}
            size={"sm"}
            className="flex items-center justify-start gap-x-1.5 rounded-lg"
            onClick={() =>
              router.push(
                `/mailing?emailroute=${searchParams.get(
                  "emailroute"
                )}&sender=${searchParams.get("sender")}&mode=reply`
              )
            }
          >
            Responder
            <Reply className="size-3" />
          </Button>
        </div>
      </div>
    </>
  );
};
