// app/api/auth/google/callback/route.ts
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

    // Guardar la cuenta de Gmail conectada en la base de datos de Supabase
    const { error } = await supabase.from("email_accounts").insert({
      user_id: userId, // Asocia la cuenta con el ID del usuario
      email,
      access_token,
      refresh_token,
      status: "DECLINED",
    });

    if (error) return NextResponse.json({ error: error.message });

    // Si la cuenta de Gmail se conectó con éxito, redirige al usuario de vuelta a la página de configuración
    const { error: updateError } = await supabase
      .from("email_accounts")
      .update({
        status: "VERIFIED",
      })
      .eq("email", email)
      .eq("user_id", userId);

    if (updateError) return NextResponse.json({ error: updateError.message });
    return NextResponse.redirect(`http://localhost:3000/setup?success=true`);
  } catch (error) {
    return NextResponse.redirect(
      `http://localhost:3000/setup?success=false&message=${error}`
    );
  }
}
