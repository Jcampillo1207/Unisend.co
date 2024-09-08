"use client";

import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { ActionsMenu } from "./actions-menu";
import { Database } from "@/database.types";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Payment = {
  email: Database["public"]["Tables"]["email_accounts"]["Row"]["email"];
  status: Database["public"]["Tables"]["email_accounts"]["Row"]["status"];
  principal: Database["public"]["Tables"]["email_accounts"]["Row"]["principal"];
  user_id: Database["public"]["Tables"]["email_accounts"]["Row"]["user_id"];
};

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "email",
    header: () => {
      return <div className="w-full flex-1">Email</div>;
    },
    cell: ({ cell }) => {
      return <div className="flex-1 w-full">{cell.getValue() as string}</div>;
    },
  },
  {
    accessorKey: "status",

    header: () => {
      return <div>Estatus</div>;
    },
    cell: ({ getValue }) => {
      return (
        <div>
          {getValue() === "DECLINED" ? (
            <Badge className="rounded-full" variant={"destructive"}>
              Rechazada
            </Badge>
          ) : (
            <Badge
              className="rounded-full bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-500"
              variant={"default"}
            >
              Cuenta verificada
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "principal",
    header: () => {
      return <div></div>;
    },
    cell: ({ getValue }) => {
      return (
        <div>
          {getValue() === true && (
            <Badge
              className="rounded-full bg-primary/20 text-primary hover:bg-primary/20"
              variant={"default"}
            >
              Principal
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: (cell) => {
      const email = cell.row.original.email;
      const principal = cell.row.original.principal;
      const user_id = cell.row.original.user_id;

      console.log(email);
      return (
        <ActionsMenu user_id={user_id} email={email} principal={principal} />
      );
    },
  },
];
