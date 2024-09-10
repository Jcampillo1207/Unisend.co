import { NextResponse } from "next/server";
import { getGmailClient } from "@/lib/gmail-client";
import { createAdminClient } from "@/lib/supabase/server-role";
import { refreshAccessToken } from "@/lib/refrsh-access-token";

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
    promo,
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
  // Codificar el subject en UTF-8 y luego en base64
  const encodedSubject =
    "=?UTF-8?B?" + Buffer.from(subject).toString("base64") + "?=";

  let email =
    "From: 'me'\r\n" +
    "To: " +
    to +
    "\r\n" +
    (cc ? "Cc: " + cc + "\r\n" : "") +
    (bcc ? "Bcc: " + bcc + "\r\n" : "") +
    "Subject: " +
    encodedSubject +
    "\r\n" +
    "Content-Type: text/html; charset=UTF-8\r\n" +
    "Content-Transfer-Encoding: base64\r\n\r\n" +
    Buffer.from(htmlBody).toString("base64");

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
  // Definir estilos para cada tema
  const styles = {
    light: {
      backgroundColor: "transparent",
      textColor: "#0a0a0a",
      linkColor: "#780CFF",
    },
    dark: {
      backgroundColor: "#0a0a0a",
      textColor: "#ffffff",
      linkColor: "#780CFF",
    },
    simple: {
      backgroundColor: "transparent",
      textColor: "#0a0a0a",
      linkColor: "#0C18FF",
    }
  };

  // Seleccionar el estilo según el tema
  const selectedStyles = styles[theme] || styles.light; // Tema claro por defecto

  // Estilos comunes
  const commonStyles = `
    font-family: Arial, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 0;
  `;

  // Limpiar el cuerpo del email
  const cleanBody = body
    .replace(/<p><br\s*\/?><\/p>/gi, "<br />")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br /><br />");

  // Función para aplicar estilos a los enlaces
  const styleLinks = (html: string) =>
    html.replace(
      /<a\s/g,
      `<a style="color: ${selectedStyles.linkColor}; text-decoration: underline;" `
    );

  // Generar el HTML envolviendo el cuerpo con una estructura de tabla
  if (!cleanBody.toLowerCase().includes("<html")) {
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tbody>
      <tr>
        <td align="center" valign="top">
          <table max-width="600px" cellpadding="0" cellspacing="0" style="
            ${commonStyles}
            background-color: ${selectedStyles.backgroundColor};
            color: ${selectedStyles.textColor};
            padding: 20px;
            border: 0px solid #e0e0e0;
            width: 100%;
            max-width: 600px;
            height: fit-content;
          ">
            <tr>
              <td style="padding-bottom: 20px;">
                ${styleLinks(cleanBody)}
              </td>
            </tr>
            <tr>
              <td align="center" valign="center" style="padding-top: 10px; padding-bottom: 10px; text-align: center; font-size: 12px !important; line-height: 1.6; color: #4d4d4d; font-family: Arial, sans-serif; border-top: 1px solid #e0e0e0;">
                <p style="${commonStyles}">
                  Este mensaje fue enviado desde <a href="https://unisend.co">Unisend.co</a>.
                </p>
              </td>
          </table>
        </td>
      </tr>
      </tbody>
    </table>
  </body>
</html>
    `.trim();
  } else {
    // Si ya existe una estructura HTML, insertamos nuestra tabla dentro del body existente
    return cleanBody
      .replace(
        /<body[^>]*>/,
        `<body>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" valign="top">
               <table width="100%" height="fit-content" max-width="600px" cellpadding="0" cellspacing="0" border="0" style="
                ${commonStyles}
                background-color: ${selectedStyles.backgroundColor};
                color: ${selectedStyles.textColor};
              ">
                <tr>
                  <td style="padding: 20px;">`
      )
      .replace(
        "</body>",
        `
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>`
      );
  }
}
