import { getGmailClient } from "@/lib/gmail-client"; // Agregada la importación correcta
import { createAdminClient } from "@/lib/supabase/server-role";
import { NextResponse } from "next/server";
import { Base64 } from "js-base64";
import { refreshAccessToken } from "@/lib/refrsh-access-token";

// Función para obtener el contenido y detalles de un correo, incluyendo HTML e imágenes embebidas
async function getMessageDetails(gmailClient: any, messageId: string) {
  const response = await gmailClient.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const payload = response.data.payload;
  const headers = payload.headers;
  const labelIds = response.data.labelIds || [];
  const dateHeader =
    headers.find((header: any) => header.name === "Date")?.value || null;

  const from =
    headers.find((header: any) => header.name === "From")?.value ||
    "Desconocido";
  const subject =
    headers.find((header: any) => header.name === "Subject")?.value ||
    "Sin Asunto";

  // Buscar las partes que contienen texto plano y HTML
  let textBody = "";
  let htmlBody = "";
  let attachments: any[] = [];
  let inlineImages: any[] = [];

  function processParts(parts: any[]) {
    parts.forEach((part: any) => {
      if (part.mimeType === "text/plain") {
        textBody = part.body.data
          ? Buffer.from(part.body.data, "base64").toString("utf-8")
          : "Sin contenido";
      } else if (part.mimeType === "text/html") {
        htmlBody = part.body.data
          ? Buffer.from(part.body.data, "base64").toString("utf-8")
          : "";
      } else if (part.mimeType.startsWith("image/")) {
        // Manejo de imágenes embebidas (inline) en el correo
        inlineImages.push({
          filename: part.filename,
          mimeType: part.mimeType,
          contentId: part.headers.find(
            (header: any) => header.name === "Content-ID"
          )?.value,
          data: part.body.attachmentId
            ? part.body.attachmentId
            : Base64.decode(part.body.data),
        });
      } else if (part.filename && part.body.attachmentId) {
        // Manejo de archivos adjuntos
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          attachmentId: part.body.attachmentId,
        });
      } else if (part.parts) {
        // Si el correo tiene partes anidadas, procesarlas también
        processParts(part.parts);
      }
    });
  }

  // Procesar las partes del correo
  if (payload.parts) {
    processParts(payload.parts);
  } else {
    // Si no hay partes (correo simple), procesar el cuerpo directamente
    textBody = payload.body.data
      ? Buffer.from(payload.body.data, "base64").toString("utf-8")
      : "Sin contenido";
  }

  // Determinar si el mensaje está marcado como no leído
  const isUnread = labelIds.includes("UNREAD");

  return {
    id: messageId,
    from,
    subject,
    date: dateHeader,
    textBody,
    htmlBody,
    inlineImages, // Imágenes embebidas
    attachments, // Archivos adjuntos
    isUnread,
  };
}

// Función para marcar un correo como leído en Gmail
async function markMessageAsRead(gmailClient: any, messageId: string) {
  return await gmailClient.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      removeLabelIds: ["UNREAD"], // Quitar la etiqueta "UNREAD" para marcar como leído
    },
  });
}

export async function GET(req: Request) {
  const supabase = createAdminClient();
  const url = new URL(req.url);
  const userId = url.searchParams.get("userid");
  const email = url.searchParams.get("email");
  const messageId = url.searchParams.get("messageId"); // Obtener el ID del mensaje

  if (!userId || !messageId) {
    return NextResponse.json(
      { error: "ID de usuario o ID del mensaje no proporcionado" },
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
    return NextResponse.json(
      { error: "Cuenta de correo no encontrada" },
      { status: 400 }
    );
  }

  let gmailClient = getGmailClient(emailAccount.access_token);

  try {
    // Intentar obtener los detalles del correo usando el messageId
    let detailedMessage = await getMessageDetails(gmailClient, messageId);

    // Si el correo está marcado como no leído, lo marcamos como leído
    if (detailedMessage.isUnread) {
      await markMessageAsRead(gmailClient, messageId);
    }

    // Devolver el contenido del mensaje
    return NextResponse.json({ message: detailedMessage });
  } catch (error: any) {
    // Si es un error de autenticación (token expirado), refrescar el token
    if (error.response?.status === 401) {
      try {
        const newAccessToken = await refreshAccessToken(
          emailAccount.refresh_token
        );

        // Actualizar el cliente de Gmail con el nuevo access token
        if (newAccessToken) {
          gmailClient = getGmailClient(newAccessToken);
        }

        // Guardar el nuevo access token en la base de datos
        await supabase
          .from("email_accounts")
          .update({ access_token: newAccessToken })
          .eq("user_id", userId)
          .eq("email", email);

        // Reintentar obtener los detalles del mensaje después de refrescar el token
        const detailedMessage = await getMessageDetails(gmailClient, messageId);

        if (detailedMessage.isUnread) {
          await markMessageAsRead(gmailClient, messageId);
        }

        return NextResponse.json({ message: detailedMessage });
      } catch (refreshError) {
        console.error("Error al refrescar el token de acceso:", refreshError);
        return NextResponse.json(
          { error: "Error al refrescar el token de acceso" },
          { status: 500 }
        );
      }
    }

    console.error("Error al obtener o modificar detalles del correo:", error);
    return NextResponse.json(
      { error: "Error al obtener detalles del correo" },
      { status: 500 }
    );
  }
}
