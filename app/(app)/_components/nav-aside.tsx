"use client";

import { createClient } from "@/lib/supabase/client";
import { Database } from "@/database.types";
import { User } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Banknote,
  Hash,
  Inbox,
  LogOut,
  Logs,
  MailWarning,
  Megaphone,
  Settings,
  Speech,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const supabase = createClient();

export const NavAside = ({
  user,
  accounts,
}: {
  user: User;
  accounts: Database["public"]["Tables"]["email_accounts"]["Row"][];
}) => {
  const params = useSearchParams();
  const router = useRouter();

  const activeAccount = accounts.find(
    (account) => account.email === params.get("emailroute")
  );

  return (
    <aside className="w-fit shrink-0 items-start justify-start border-r h-full flex flex-col gap-y-1.5">
      <div className="flex flex-col h-14 border-b px-2 items-center justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full text-sm bg-muted"
            >
              {user.user_metadata.name.charAt(0).toUpperCase()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" sideOffset={5}>
            <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-x-5">
                {activeAccount?.email || "Seleccionar cuenta"}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {accounts.map((account) => (
                  <DropdownMenuItem
                    key={account.email}
                    onClick={() =>
                      router.replace(
                        `/mailing?emailroute=${account.email}`
                      )
                    }
                    className={cn(
                      "gap-x-1.5 text-muted-foreground",
                      activeAccount === account &&
                        "text-foreground bg-primary/10 focus:bg-primary/20"
                    )}
                  >
                    {(activeAccount === account && (
                      <div className="size-1.5 text-primary bg-primary rounded-full" />
                    )) || (
                      <div className="size-1.5 text-primary bg-transparent opacity-0 rounded-full" />
                    )}
                    {account.email}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="items-center justify-between">
              Ajustes <Settings className="size-3.5" />
            </DropdownMenuItem>
            <DropdownMenuItem className="items-center justify-between">
              Suscripción <Banknote className="size-3.5" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                const { error } = await supabase.auth.signOut();

                if (error) {
                  toast.error("Error al cerrar sesión");
                } else {
                  toast.success("Sesion cerrada correctamente");
                  router.push("/login");
                }
              }}
              className="bg-destructive/10 text-red-500 focus:bg-destructive/20 focus:text-red-500 items-center justify-between"
            >
              Cerrar sesión
              <LogOut className="size-3.5" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="w-full flex flex-col gap-y-1.5 items-center">
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                onClick={() =>
                  router.replace(
                    `/mailing?emailroute=${
                      activeAccount?.email
                    }&category=Primary${
                      params.get("f") && params.get("f") === "true"
                        ? "&f=true"
                        : ""
                    }${params.get("q") ? `&q=${params.get("q")}` : ""}${
                      params.get("date") ? `&date=${params.get("date")}` : ""
                    }${
                      params.get("sender")
                        ? `&sender=${params.get("sender")}`
                        : ""
                    }${
                      params.get("hasAttachment")
                        ? `&hasAttachment=${params.get("hasAttachment")}`
                        : ""
                    }${
                      params.get("isImportant")
                        ? `&isImportant=${params.get("isImportant")}`
                        : ""
                    }`
                  )
                }
                variant={"outline"}
                size="icon"
                className={cn(
                  "rounded-lg text-muted-foreground",
                  params.get("category") === "Primary" &&
                    "bg-primary/50 text-foreground border-primary hover:bg-primary/60"
                )}
              >
                <Inbox className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              sideOffset={5}
              className="bg-muted border text-foreground"
              side="right"
              align="center"
            >
              Principal
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                onClick={() =>
                  router.replace(
                    `/mailing?emailroute=${
                      activeAccount?.email
                    }&category=Social${
                      params.get("f") && params.get("f") === "true"
                        ? "&f=true"
                        : ""
                    }${params.get("q") ? `&q=${params.get("q")}` : ""}${
                      params.get("date") ? `&date=${params.get("date")}` : ""
                    }${
                      params.get("sender")
                        ? `&sender=${params.get("sender")}`
                        : ""
                    }${
                      params.get("hasAttachment")
                        ? `&hasAttachment=${params.get("hasAttachment")}`
                        : ""
                    }${
                      params.get("isImportant")
                        ? `&isImportant=${params.get("isImportant")}`
                        : ""
                    }`
                  )
                }
                variant={"outline"}
                size="icon"
                className={cn(
                  "rounded-lg text-muted-foreground",
                  params.get("category") === "Social" &&
                    "bg-primary/50 text-foreground border-primary hover:bg-primary/60"
                )}
              >
                <Hash className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="bg-muted border text-foreground"
              side="right"
              align="center"
              sideOffset={5}
            >
              Social
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                onClick={() =>
                  router.replace(
                    `/mailing?emailroute=${
                      activeAccount?.email
                    }&category=Updates${
                      params.get("f") && params.get("f") === "true"
                        ? "&f=true"
                        : ""
                    }${params.get("q") ? `&q=${params.get("q")}` : ""}${
                      params.get("date") ? `&date=${params.get("date")}` : ""
                    }${
                      params.get("sender")
                        ? `&sender=${params.get("sender")}`
                        : ""
                    }${
                      params.get("hasAttachment")
                        ? `&hasAttachment=${params.get("hasAttachment")}`
                        : ""
                    }${
                      params.get("isImportant")
                        ? `&isImportant=${params.get("isImportant")}`
                        : ""
                    }`
                  )
                }
                variant={"outline"}
                size="icon"
                className={cn(
                  "rounded-lg text-muted-foreground",
                  params.get("category") === "Updates" &&
                    "bg-primary/50 text-foreground border-primary hover:bg-primary/60"
                )}
              >
                <Logs className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="bg-muted border text-foreground"
              side="right"
              align="center"
              sideOffset={5}
            >
              Actualizaciones
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                onClick={() =>
                  router.replace(
                    `/mailing?emailroute=${
                      activeAccount?.email
                    }&category=Promotions${
                      params.get("f") && params.get("f") === "true"
                        ? "&f=true"
                        : ""
                    }${params.get("q") ? `&q=${params.get("q")}` : ""}${
                      params.get("date") ? `&date=${params.get("date")}` : ""
                    }${
                      params.get("sender")
                        ? `&sender=${params.get("sender")}`
                        : ""
                    }${
                      params.get("hasAttachment")
                        ? `&hasAttachment=${params.get("hasAttachment")}`
                        : ""
                    }${
                      params.get("isImportant")
                        ? `&isImportant=${params.get("isImportant")}`
                        : ""
                    }`
                  )
                }
                variant={"outline"}
                size="icon"
                className={cn(
                  "rounded-lg text-muted-foreground",
                  params.get("category") === "Promotions" &&
                    "bg-primary/50 text-foreground border-primary hover:bg-primary/60"
                )}
              >
                <Megaphone className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="bg-muted border text-foreground"
              side="right"
              align="center"
              sideOffset={5}
            >
              Promociones
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                onClick={() =>
                  router.replace(
                    `/mailing?emailroute=${
                      activeAccount?.email
                    }&category=Forums${
                      params.get("f") && params.get("f") === "true"
                        ? "&f=true"
                        : ""
                    }${params.get("q") ? `&q=${params.get("q")}` : ""}${
                      params.get("date") ? `&date=${params.get("date")}` : ""
                    }${
                      params.get("sender")
                        ? `&sender=${params.get("sender")}`
                        : ""
                    }${
                      params.get("hasAttachment")
                        ? `&hasAttachment=${params.get("hasAttachment")}`
                        : ""
                    }${
                      params.get("isImportant")
                        ? `&isImportant=${params.get("isImportant")}`
                        : ""
                    }`
                  )
                }
                variant={"outline"}
                size="icon"
                className={cn(
                  "rounded-lg text-muted-foreground",
                  params.get("category") === "Forums" &&
                    "bg-primary/50 text-foreground border-primary hover:bg-primary/60"
                )}
              >
                <Speech className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="bg-muted border text-foreground"
              side="right"
              align="center"
              sideOffset={5}
            >
              Foros
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                onClick={() =>
                  router.replace(
                    `/mailing?emailroute=${activeAccount?.email}&category=Spam${
                      params.get("f") && params.get("f") === "true"
                        ? "&f=true"
                        : ""
                    }${params.get("q") ? `&q=${params.get("q")}` : ""}${
                      params.get("date") ? `&date=${params.get("date")}` : ""
                    }${
                      params.get("sender")
                        ? `&sender=${params.get("sender")}`
                        : ""
                    }${
                      params.get("hasAttachment")
                        ? `&hasAttachment=${params.get("hasAttachment")}`
                        : ""
                    }${
                      params.get("isImportant")
                        ? `&isImportant=${params.get("isImportant")}`
                        : ""
                    }`
                  )
                }
                variant={"outline"}
                size="icon"
                className={cn(
                  "rounded-lg text-muted-foreground",
                  params.get("category") === "Spam" &&
                    "bg-primary/50 text-foreground border-primary hover:bg-primary/60"
                )}
              >
                <MailWarning className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="bg-muted border text-foreground"
              side="right"
              align="center"
              sideOffset={5}
            >
              Spam
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
};
