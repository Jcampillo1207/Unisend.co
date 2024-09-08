import { NextRequest, NextResponse } from "next/server";
import { getGmailClient } from "@/lib/gmail-client"; // Función para obtener el cliente de Gmail
import { createAdminClient } from "@/lib/supabase/server-role"; // Función para acceder a la base de datos
import { refreshAccessToken } from "@/lib/refrsh-access-token";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const { emailId, userId, replyBody, email, sender, attachments } =
      extractFormData(formData);

    if (!emailId || !userId || !replyBody) {
      return createErrorResponse("Faltan datos obligatorios", 400);
    }

    console.log(emailId, userId, replyBody, email, sender, attachments);

    const supabase = createAdminClient();
    const { data: emailAccount, error } = await supabase
      .from("email_accounts")
      .select("access_token, refresh_token")
      .eq("email", email)
      .eq("user_id", userId)
      .single();

    if (error || !emailAccount) {
      return createErrorResponse("No se pudo obtener la cuenta de correo", 400);
    }

    let accessToken = emailAccount.access_token;
    const refreshToken = emailAccount.refresh_token;

    // Validar el tamaño total de los archivos adjuntos
    const totalSize = validateAttachmentsSize(attachments);
    if (totalSize > 25 * 1024 * 1024) {
      return createErrorResponse(
        "El tamaño total de los archivos adjuntos excede los 25 MB",
        400
      );
    }

    let gmailClient = getGmailClient(accessToken);

    try {
      // Intentar enviar el correo con los archivos adjuntos
      await sendEmailWithAttachments(
        gmailClient,
        emailId,
        replyBody,
        attachments,
        email,
        sender
      );
      return createSuccessResponse("Correo respondido con éxito");
    } catch (error: any) {
      if (error.response?.status === 401) {
        // El token ha expirado, intentar refrescarlo
        return handleTokenRefresh(
          supabase,
          refreshToken,
          userId,
          emailId,
          replyBody,
          attachments,
          email,
          sender
        );
      }
      throw error; // Lanzar el error si no es un problema de autenticación
    }
  } catch (error) {
    console.error("Error general en el envío de correo:", error);
    return createErrorResponse("Error en el procesamiento del correo", 500);
  }
}

// Extrae los datos del formulario y los convierte en un objeto
function extractFormData(formData: FormData) {
  const emailId = formData.get("emailId") as string;
  const userId = formData.get("userId") as string;
  const replyBody = formData.get("replyBody") as string;
  const email = formData.get("email") as string;
  const sender = formData.get("sender") as string;
  const attachments = formData.getAll("attachments") as File[];
  return { emailId, userId, replyBody, email, sender, attachments };
}

// Función que maneja el refresco de tokens y reintenta el envío del correo
async function handleTokenRefresh(
  supabase: any,
  refreshToken: string,
  userId: string,
  emailId: string,
  replyBody: string,
  attachments: File[],
  email: string,
  sender: string
) {
  try {
    const newAccessToken = await refreshAccessToken(refreshToken);
    if (!newAccessToken) {
      return createErrorResponse("Error al refrescar el token", 500);
    }

    // Actualizar token en la base de datos
    await supabase
      .from("email_accounts")
      .update({ access_token: newAccessToken })
      .eq("email", email)
      .eq("user_id", userId);

    // Reintentar con el nuevo token
    const gmailClient = getGmailClient(newAccessToken);
    await sendEmailWithAttachments(
      gmailClient,
      emailId,
      replyBody,
      attachments,
      email,
      sender
    );
    return createSuccessResponse(
      "Correo respondido con éxito tras refrescar el token"
    );
  } catch (error) {
    console.error("Error al refrescar el token:", error);
    return createErrorResponse("Error al refrescar el token", 500);
  }
}

// Función para enviar el correo con los archivos adjuntos
async function sendEmailWithAttachments(
  gmailClient: any,
  emailId: string,
  replyBody: string,
  attachments: File[],
  email: string,
  sender: string
) {
  const rawMessage = await createEmailMessage(
    emailId,
    replyBody,
    attachments,
    email,
    sender
  );

  await gmailClient.users.messages.send({
    userId: "me",
    requestBody: { raw: rawMessage },
  });
}

// Función que valida el tamaño total de los archivos adjuntos
function validateAttachmentsSize(attachments: File[]): number {
  return attachments.reduce((acc, file) => acc + file.size, 0);
}

// Función que crea el mensaje en formato MIME con archivos adjuntos
async function createEmailMessage(
  emailId: string,
  replyBody: string,
  attachments: (File | string)[],
  email: string,
  sender: string
): Promise<string> {
  const boundary = "nextPart";
  const mixedBoundary = "mixedBoundary";

  // Function to process attachments
  const processAttachment = async (
    attachment: File | string,
    index: number
  ) => {
    if (typeof attachment === "string") {
      // It's a base64 string
      const match = attachment.match(/^data:(.+);base64,(.*)$/);
      if (match) {
        return {
          type: match[1],
          data: match[2],
          name: `embedded-image-${index + 1}.${match[1].split("/")[1]}`,
          contentId: `embedded-image-${index + 1}`,
        };
      }
      throw new Error("Invalid base64 string format");
    } else {
      // It's a File object
      return {
        type: attachment.type,
        data: await fileToBase64(attachment),
        name: attachment.name,
        contentId: `embedded-image-${index + 1}`,
      };
    }
  };

  // Process all attachments
  const processedAttachments = await Promise.all(
    attachments.map(processAttachment)
  );

  // Separate embedded images from other attachments
  const embeddedImages = processedAttachments.filter((att) =>
    att.type.startsWith("image/")
  );
  const otherAttachments = processedAttachments.filter(
    (att) => !att.type.startsWith("image/")
  );

  // Create HTML body with embedded image references
  const htmlBody = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              font-size: 16px;
              line-height: 1.6;
              color: #FFFFFF;
              background-color: #ededed;
              padding: 20px;
              margin: 0 60px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              color: #FFDD57;
              font-size: 24px;
              padding-bottom: 20px;
            }
            .content {
              padding: 20px;
              font-size: 16px;
              line-height: 1.6;
            }
            .content img {
              max-width: 100%;
              height: auto;
              border-radius: 10px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              font-size: 14px;
              color: #AAAAAA;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <p>${replyBody}</p>
              ${embeddedImages
                .map(
                  (img, index) =>
                    `<br><img src="cid:${img.contentId}" alt="Embedded Image ${
                      index + 1
                    }" />`
                )
                .join("")}
            </div>
            <div class="footer">
             Este correo ha sido enviado por medio de Unisend.co
            </div>
          </div>
        </body>
      </html>
    `;

  // Create plain text body
  const plainTextBody = replyBody.replace(/<[^>]*>?/gm, "");

  // Start building the message
  let message = [
    `From: ${email}`,
    `To: ${sender}`,
    "Subject: Re: Asunto del correo original",
    `In-Reply-To: ${emailId}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    "",
    `--${mixedBoundary}`,
    `Content-Type: multipart/related; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: multipart/alternative; boundary=alt",
    "",
    "--alt",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    plainTextBody,
    "",
    "--alt",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    htmlBody,
    "",
    "--alt--",
  ].join("\r\n");

  // Add embedded images
  embeddedImages.forEach((img) => {
    message += [
      "",
      `--${boundary}`,
      `Content-Type: ${img.type}`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: inline; filename="${img.name}"`,
      `Content-ID: <${img.contentId}>`,
      "",
      img.data,
    ].join("\r\n");
  });

  message += `\r\n--${boundary}--`;

  // Add other attachments
  otherAttachments.forEach((att) => {
    message += [
      "",
      `--${mixedBoundary}`,
      `Content-Type: ${att.type}; name="${att.name}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${att.name}"`,
      "",
      att.data,
    ].join("\r\n");
  });

  message += `\r\n--${mixedBoundary}--`;

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Helper function to convert File to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// Funciones auxiliares para la respuesta
function createErrorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function createSuccessResponse(message: string) {
  return NextResponse.json({ message }, { status: 200 });
}
