import { CircleDashed, MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Database } from "@/database.types";
const supabase = createClient();

export const ActionsMenu = ({
  email,
  principal,
  user_id,
}: {
  email: Database["public"]["Tables"]["email_accounts"]["Row"]["email"];
  principal: Database["public"]["Tables"]["email_accounts"]["Row"]["principal"];
  user_id: Database["public"]["Tables"]["email_accounts"]["Row"]["user_id"];
}) => {
  ;
  async function handleDeleteEmail() {
    toast.loading("Eliminando correo...");
    const { error } = await supabase
      .from("email_accounts")
      .delete()
      .eq("email", email);
    if (error) {
      console.error(error);
      toast.dismiss();
      toast.error("Error al eliminar el correo");
    } else {
      ;
      toast.dismiss();
      toast.success("Correo electrónico eliminado correctamente");
    }
  }

  async function handleUpdateEmail() {
    toast.loading("Actualizando correo...");
    const { error } = await supabase
      .from("email_accounts")
      .update({ principal: !principal })
      .eq("email", email);
    if (error) {
      return console.error(error);
    }

    const { error: updateError } = await supabase
      .from("email_accounts")
      .update({ principal: false })
      .eq("principal", true)
      .eq("user_id", user_id)
      .neq("email", email);

    if (updateError) {
      toast.dismiss();
      toast.error("Error al actualizar el correo");
      return console.error(updateError);
    } else {
      toast.dismiss();
      toast.success("Correo actualizado correctamente");
    }
  }

  ;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-muted border">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-between gap-x-3"
          onClick={handleUpdateEmail}
        >
          Convertir en principal
          <CircleDashed className="size-3.5" />
        </DropdownMenuItem>
        <DropdownMenuItem
          className="bg-destructive/20 text-red-500 focus:bg-destructive/20 focus:text-red-500 justify-between gap-x-3"
          onClick={handleDeleteEmail}
        >
          Eliminar
          <Trash2 className="size-3.5" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
