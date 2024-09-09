import { NextResponse } from "next/server";
import { getGmailClient } from "@/lib/gmail-client";
import { createAdminClient } from "@/lib/supabase/server-role";
import { refreshAccessToken } from "@/lib/refrsh-access-token";
import quotedPrintable from "quoted-printable";

export async function POST(req: Request) {
  console.log("Iniciando proceso de envío de correo");
  const supabase = createAdminClient();
  const {
    userId,
    email,
    to,
    cc,
    bcc,
    subject,
    body,
    attachments,
    mode,
    threadId,
    theme,
  } = await req.json();

  console.log("Recibido en el servidor:");
  console.log("From:", email);
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("Body length:", body.length);
  console.log("Body (primeros 100 caracteres):", body.substring(0, 100));

  if (!userId || !email || !to || !subject || !body) {
    console.error("Faltan datos requeridos:", {
      userId,
      email,
      to,
      subject,
      bodyLength: body?.length,
    });
    return NextResponse.json(
      { error: "Faltan datos requeridos" },
      { status: 400 }
    );
  }

  const { data: emailAccount, error } = await supabase
    .from("email_accounts")
    .select("access_token, refresh_token")
    .eq("user_id", userId)
    .eq("email", email)
    .single();

  if (error || !emailAccount) {
    console.error("Error al obtener la cuenta de correo", error);
    return NextResponse.json(
      { error: "Cuenta de correo no encontrada" },
      { status: 400 }
    );
  }

  console.log("Cuenta de correo obtenida para:", email);

  let gmailClient = getGmailClient(emailAccount.access_token);

  try {
    console.log("Procesando el cuerpo del correo electrónico");
    const wrappedHtmlBody = wrapHtmlBody(body, theme);
    const message = createEmailMessage(
      email,
      to,
      cc,
      bcc,
      subject,
      wrappedHtmlBody,
      attachments
    );

    console.log("Mensaje creado:", message);

    let sendRequest: any = {
      userId: "me",
      requestBody: {
        raw: message, // El mensaje base64 directamente
      },
    };

    if (mode === "reply" && threadId) {
      console.log("Modo de respuesta detectado. Thread ID:", threadId);
      sendRequest.requestBody.threadId = threadId;
    }

    console.log("Enviando correo a través de Gmail API");
    const response = await gmailClient.users.messages.send(sendRequest);

    console.log(
      "Respuesta de la API de Gmail:",
      JSON.stringify(response.data, null, 2)
    );

    console.log("Correo enviado exitosamente. ID del mensaje:", response);

    return NextResponse.json({ messageId: response.data.id });
  } catch (error: any) {
    console.error("Error al enviar el correo:", error);

    if (error.response?.status === 401) {
      console.log("Token expirado, intentando refrescar");
      try {
        const newAccessToken = await refreshAccessToken(
          emailAccount.refresh_token
        );
        if (newAccessToken) {
          console.log("Token refrescado exitosamente");
          gmailClient = getGmailClient(newAccessToken);
          await supabase
            .from("email_accounts")
            .update({ access_token: newAccessToken })
            .eq("user_id", userId)
            .eq("email", email);

          console.log("Reintentando envío de correo con el nuevo token");
          const wrappedHtmlBody = wrapHtmlBody(body, theme);
          const message = createEmailMessage(
            email,
            to,
            cc,
            bcc,
            subject,
            wrappedHtmlBody,
            attachments
          );

          console.log("Mensaje creado:", message);

          console.log("Mensaje decodificado completo:");
          console.log(decodeMessage(message));

          console.log("Mensaje reintentado, longitud:", message.length);
          const retryResponse = await gmailClient.users.messages.send({
            userId: "me",
            requestBody: {
              raw: message, // El mensaje base64 directamente
            },
          });

          console.log("Reintento exitoso. ID del mensaje:", retryResponse);
          return NextResponse.json({ messageId: retryResponse.data.id });
        }
      } catch (refreshError) {
        console.error("Error al refrescar el token de acceso:", refreshError);
        return NextResponse.json(
          { error: "Error al refrescar el token de acceso" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Error al enviar el correo" },
      { status: 500 }
    );
  }
}
function createEmailMessage(
  from: string,
  to: string,
  cc: string,
  bcc: string,
  subject: string,
  htmlBody: string,
  attachments: any[]
) {
  var email =
    "From: 'me'\r\n" +
    "To: " +
    to +
    "\r\n" +
    "Subject: " +
    subject +
    "\r\n" +
    "Content-Type: text/html; charset='UTF-8'\r\n" +
    "Content-Transfer-Encoding: base64\r\n\r\n" +
    htmlBody;

  return Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeMessage(encodedMessage: string): string {
  return Buffer.from(encodedMessage, "base64").toString("utf-8");
}

function wrapHtmlBody(body: string, theme: "light" | "dark"): string {
  // Definir estilos para cada tema, usando "Inter" como fuente principal
  const styles = {
    light: `
      body {
        background-color: #ffffff;
        color: #000000;
        font-family: 'Inter', sans-serif;
        padding: 20px;
        height: fit-content;
        overflow: hidden;
      }
      a {
        color: #1a73e8;
      }
    `,
    dark: `
      body {
        background-color: #121212;
        color: #ffffff;
        font-family: 'Inter', sans-serif;
        padding: 20px;
        height: fit-content;
        overflow: hidden;
      }
      a {
        color: #8ab4f8;
      }
    `,
  };

  // Seleccionar el estilo según el tema
  const selectedStyle = styles[theme] || styles.light; // Default to light theme if none provided

  // Generar el HTML envolviendo el cuerpo con los estilos inline
  if (!body.toLowerCase().includes("<html")) {
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      ${selectedStyle}
    </style>
  </head>
  <body>
    ${body}
  </body>
</html>
    `.trim();
  }
  return body;
}
