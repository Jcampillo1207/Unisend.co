import { getGmailClient } from "@/lib/gmail-client";
import { createAdminClient } from "@/lib/supabase/server-role";
import { NextResponse } from "next/server";
import { refreshAccessToken } from "@/lib/refrsh-access-token";

// Definir el tipo de la estructura de datos que viene en la solicitud
interface SendEmailRequest {
  to: string;
  subject: string;
  message: string;
}

export async function POST(req: Request) {
  // Parsear el cuerpo de la solicitud
  const { to, subject, message }: SendEmailRequest = await req.json();

  const supabase = createAdminClient();
  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id");

  // Validar los datos de la solicitud
  if (!userId || !to || !subject || !message) {
    return NextResponse.json({ error: "Datos insuficientes" }, { status: 400 });
  }

  // Definir la respuesta de Supabase
  interface EmailAccount {
    access_token: string;
    refresh_token: string;
  }

  // Obtener las credenciales de la cuenta de correo conectada desde Supabase
  const {
    data: emailAccount,
    error,
  }: { data: EmailAccount | null; error: any } = await supabase
    .from("email_accounts")
    .select("access_token, refresh_token")
    .eq("user_id", userId)
    .single();

  if (error || !emailAccount) {
    return NextResponse.json(
      { error: "Cuenta de correo no encontrada" },
      { status: 400 }
    );
  }

  // Inicializar el cliente de Gmail
  let gmailClient = getGmailClient(emailAccount.access_token);
  // Crear el mensaje en formato base64
  const rawMessage = Buffer.from(
    `To: ${to}\r\nSubject: ${subject}\r\n\r\n${message}`
  ).toString("base64");

  try {
    // Enviar el correo electrónico
    const response = await gmailClient.users.messages.send({
      userId: "me",
      requestBody: {
        raw: rawMessage,
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error al enviar correo:", error);

    // Verificar si el error es de expiración de token (401)
    if (error.response && error.response.status === 401) {
      try {
        // Intentar refrescar el token de acceso
        const newAccessToken = await refreshAccessToken(
          emailAccount.refresh_token
        );

        if (newAccessToken) {
          // Actualizar el token de acceso en la base de datos
          await supabase
            .from("email_accounts")
            .update({ access_token: newAccessToken })
            .eq("user_id", userId);

          // Inicializar el cliente de Gmail con el nuevo token
          gmailClient = getGmailClient(newAccessToken);
        }

        // Reintentar enviar el correo
        const response = await gmailClient.users.messages.send({
          userId: "me",
          requestBody: {
            raw: rawMessage,
          },
        });

        return NextResponse.json(response.data);
      } catch (refreshError: any) {
        console.error("Error al refrescar el token:", refreshError);
        return NextResponse.json(
          { error: "Error al refrescar el token" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Error al enviar correo" },
      { status: 500 }
    );
  }
}
