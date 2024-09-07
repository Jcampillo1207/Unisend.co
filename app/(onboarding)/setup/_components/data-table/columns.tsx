"use client";

import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";

import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Payment = {
  email: string;
  status: "DECLINED" | "VERIFIED";
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
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
