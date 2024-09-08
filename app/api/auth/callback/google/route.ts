import { getAccessToken } from "@/lib/google/google-auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server-role";
import { SupabaseClient } from "@supabase/supabase-js";

interface AccessTokenResponse {
  email: string;
  access_token: string | null;
  refresh_token: string | null;
}

interface EmailAccount {
  user_id: string;
  email: string;
  access_token: string;
  refresh_token: string;
  status: string;
  principal: boolean;
}

interface SupabaseError {
  message: string;
}

export async function GET(req: Request): Promise<NextResponse> {
  const supabase: SupabaseClient = createAdminClient();
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const userId = url.searchParams.get("state"); // Google returns userId in the "state" parameter

  if (!code || !userId) {
    return NextResponse.json(
      { error: "Código o ID de usuario no proporcionado" },
      { status: 400 }
    );
  }

  try {
    // Obtener el token de acceso y el correo de la cuenta conectada
    const { email, access_token, refresh_token }: AccessTokenResponse =
      await getAccessToken(code);

    if (!email || !access_token || !refresh_token) {
      return NextResponse.json(
        { error: "Error obteniendo el token o el correo electrónico." },
        { status: 400 }
      );
    }

    // Verificar cuántas cuentas de correo ya están conectadas para este usuario
    const { data: existingAccounts, error: existingError } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("user_id", userId);

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 }
      );
    }

    // Asegurarse de que 'existingAccounts' está definido
    if (!existingAccounts) {
      return NextResponse.json(
        { error: "No se pudieron recuperar las cuentas existentes." },
        { status: 500 }
      );
    }

    // Si no hay cuentas, esta será la cuenta principal
    const isFirstAccount = existingAccounts.length === 0;

    // Insertar la nueva cuenta de Gmail conectada
    const newAccount: EmailAccount = {
      user_id: userId,
      email,
      access_token,
      refresh_token,
      status: "VERIFIED",
      principal: isFirstAccount, // Será principal solo si es la primera cuenta conectada
    };

    const { error: insertError } = await supabase
      .from("email_accounts")
      .insert(newAccount);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Si la cuenta de Gmail se conectó correctamente, redirigir al usuario a la página de configuración
    return NextResponse.redirect(`https://unisend.co/setup?success=true`);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.redirect(
        `https://unisend.co/setup?success=false&message=${encodeURIComponent(
          error.message
        )}`
      );
    } else {
      return NextResponse.redirect(
        `https://unisend.co/setup?success=false&message=An unknown error occurred`
      );
    }
  }
}
