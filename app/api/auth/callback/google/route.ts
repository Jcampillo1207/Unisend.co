import { getAccessToken } from "@/lib/google/google-auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server-role";

export async function GET(req: Request) {
  const supabase = createAdminClient();
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const userId = url.searchParams.get("state"); // Google devuelve el userId en el parámetro "state"

  if (!code || !userId) {
    return NextResponse.json(
      { error: "Código o ID de usuario no proporcionado" },
      { status: 400 }
    );
  }

  try {
    // Obtener el token de acceso y el email de la cuenta conectada
    const { email, access_token, refresh_token } = await getAccessToken(code);

    // Verificar cuántas cuentas de correo ya están conectadas para este usuario
    const { data: existingAccounts, error: existingError } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("user_id", userId);

    if (existingError) {
      return NextResponse.json({ error: existingError.message });
    }

    // Si no hay cuentas, esta cuenta será la principal
    const isFirstAccount = existingAccounts.length === 0;

    // Insertar la nueva cuenta de Gmail conectada
    const { error: insertError } = await supabase
      .from("email_accounts")
      .insert({
        user_id: userId,
        email,
        access_token,
        refresh_token,
        status: "VERIFIED",
        principal: isFirstAccount, // Solo será principal si es la primera cuenta conectada
      });

    if (insertError) return NextResponse.json({ error: insertError.message });

    // Si la cuenta de Gmail se conectó con éxito, redirige al usuario de vuelta a la página de configuración
    return NextResponse.redirect(`http://localhost:3000/setup?success=true`);
  } catch (error: any) {
    return NextResponse.redirect(
      `http://localhost:3000/setup?success=false&message=${error.message}`
    );
  }
}
