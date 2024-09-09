"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client"; // Botón para agregar cuentas de Gmail
import AddEmailAccount from "./_components/add-email-account";
import { DataTable } from "./_components/data-table/data-table";
import { columns } from "./_components/data-table/columns";
import { Database } from "@/database.types";

const supabase = createClient();
const SetupPage = () => {
  const [emailAccounts, setEmailAccounts] = useState<
    Database["public"]["Tables"]["email_accounts"]["Row"][]
  >([]);

  useEffect(() => {
    const fetchEmailAccounts = async () => {
      // Obtén el usuario autenticado actual
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Si no hay un usuario autenticado, retorna vacío
      if (!user) {
        setEmailAccounts([]);
        return;
      }

      // Obtén las cuentas de correo asociadas a este usuario
      const { data, error } = await supabase
        .from("email_accounts")
        .select("email, status, principal, user_id")
        .eq("user_id", user.id)
        .order("principal", { ascending: false })
        .returns<Database["public"]["Tables"]["email_accounts"]["Row"][]>();

      ;

      if (error) {
        console.error("Error al obtener cuentas de correo:", error);
      } else {
        setEmailAccounts(data || []);
      }
    };

    const channels = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "email_accounts" },
        (payload) => {
          fetchEmailAccounts();
          ;
        }
      )
      .subscribe();

    fetchEmailAccounts();

    return () => {
      supabase.removeChannel(channels);
    };
  }, []);

  return (
    <div className="container mx-auto w-full max-w-2xl flex flex-col gap-y-5 pb-5 border-b px-5 md:px-7 lg:px-14 xl:px-0">
      <span className="w-full items-center justify-between flex gap-x-5">
        <h1 className="text-lg xl:text-xl 2xl:text-2xl font-bold mb-4 tracking-wide">
          Conecta tus cuentas de google
        </h1>
        <AddEmailAccount />
      </span>
      <DataTable columns={columns} data={emailAccounts} />
    </div>
  );
};

export default SetupPage;
