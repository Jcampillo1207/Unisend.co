"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Reply } from "lucide-react";
import React, { useState } from "react";
import { ReplyDialog } from "./dialogs/dialog-reply";
import { useRouter, useSearchParams } from "next/navigation";

export const HeaderEmail = ({
  emailId,
  userId,
}: {
  emailId: string;
  userId: string;
}) => {
  const [openReply, setOpenReply] = useState(false);
  const param = useSearchParams().get("sender") as string;
  const router = useRouter();


  return (
    <>
      <div className="w-full h-14 items-center justify-between flex px-4 border-b bg-background shrink-0 min-h-14 sticky top-0 left-0 z-10">
        <div className="w-fit h-full items-center justify-center flex gap-x-1.5">
          <Button
            variant={"default"}
            size={"sm"}
            className="flex items-center justify-start gap-x-1.5 rounded-lg"
            onClick={() => setOpenReply(true)}
          >
            Responder
            <Reply className="size-3" />
          </Button>
        </div>
      </div>
      <ReplyDialog
        emailSender={param}
        open={openReply}
        setOpen={setOpenReply}
        emailId={emailId}
        userId={userId}
      />
    </>
  );
};
