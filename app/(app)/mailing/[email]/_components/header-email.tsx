"use client";

import { Button } from "@/components/ui/button";
import { Reply } from "lucide-react";
import React, { useState } from "react";
import { ReplyDialog } from "./dialogs/dialog-reply";
import { useSearchParams } from "next/navigation";

export const HeaderEmail = ({
  emailId,
  userId,
}: {
  emailId: string;
  userId: string;
}) => {
  const [openReply, setOpenReply] = useState(false);
  const param = useSearchParams().get("sender") as string;

  return (
    <>
      <div className="w-full h-14 items-center justify-between flex px-5 md:px-7 lg:px-14 border-b bg-background shrink-0 min-h-14 sticky top-0 left-0 z-10">
        <div className="w-fit h-full flex items-center justify-start">
          Acciones
        </div>
        <div className="w-fit h-full items-center justify-center flex gap-x-1.5">
          <Button
            variant={"default"}
            size={"sm"}
            className="flex items-center justify-start gap-x-1.5"
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
