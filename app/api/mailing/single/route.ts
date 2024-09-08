import { getGmailClient } from "@/lib/gmail-client";
import { createAdminClient } from "@/lib/supabase/server-role";
import { NextResponse } from "next/server";
import { Base64 } from "js-base64";
import { refreshAccessToken } from "@/lib/refrsh-access-token";
import { gmail_v1 } from "googleapis"; // Tipado para Gmail

// Tipo de respuesta para el mensaje detallado
interface MessageDetails {
  id: string;
  from: string;
  subject: string;
  date: string | null;
  textBody: string;
  htmlBody: string;
  inlineImages: any[];
  attachments: any[];
  isUnread: boolean;
}

// Función para obtener el contenido y detalles de un correo, incluyendo HTML e imágenes embebidas
async function getMessageDetails(
  gmailClient: gmail_v1.Gmail,
  messageId: string
): Promise<MessageDetails> {
  const response = await gmailClient.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const payload = response.data.payload;
  const headers = payload?.headers || [];
  const labelIds = response.data.labelIds || [];
  const dateHeader =
    headers.find((header) => header.name === "Date")?.value || null;
  const from =
    headers.find((header) => header.name === "From")?.value || "Desconocido";
  const subject =
    headers.find((header) => header.name === "Subject")?.value || "Sin Asunto";

  let textBody = "";
  let htmlBody = "";
  let attachments: any[] = [];
  let inlineImages: any[] = [];

  // Función para procesar las partes del correo
  function processParts(parts: gmail_v1.Schema$MessagePart[]) {
    parts.forEach((part) => {
      if (part.mimeType === "text/plain" && !textBody) {
        textBody = part.body?.data
          ? Buffer.from(part.body.data, "base64").toString("utf-8")
          : "Sin contenido";
      } else if (part.mimeType === "text/html" && !htmlBody) {
        htmlBody = part.body?.data
          ? Buffer.from(part.body.data, "base64").toString("utf-8")
          : "";
      } else if (part.mimeType?.startsWith("image/")) {
        inlineImages.push({
          filename: part.filename,
          mimeType: part.mimeType,
          contentId: part.headers?.find(
            (header) => header.name === "Content-ID"
          )?.value,
          data: part.body?.attachmentId
            ? part.body.attachmentId
            : Base64.decode(part.body?.data || ""),
        });
      } else if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          attachmentId: part.body.attachmentId,
        });
      } else if (part.parts) {
        processParts(part.parts);
      }
    });
  }

  if (payload?.parts) {
    processParts(payload.parts);
  } else {
    textBody = payload?.body?.data
      ? Buffer.from(payload.body.data, "base64").toString("utf-8")
      : "Sin contenido";
  }

  const isUnread = labelIds.includes("UNREAD");

  return {
    id: messageId,
    from,
    subject,
    date: dateHeader,
    textBody,
    htmlBody,
    inlineImages,
    attachments,
    isUnread,
  };
}

// Función para marcar un correo como leído en Gmail
async function markMessageAsRead(
  gmailClient: gmail_v1.Gmail,
  messageId: string
) {
  return await gmailClient.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      removeLabelIds: ["UNREAD"],
    },
  });
}

export async function GET(req: Request) {
  const supabase = createAdminClient();
  const url = new URL(req.url);
  const userId = url.searchParams.get("userid");
  const email = url.searchParams.get("email");
  const messageId = url.searchParams.get("messageId");

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
    // Intentar obtener los detalles del correo
    let detailedMessage = await getMessageDetails(gmailClient, messageId);

    // Si el correo está marcado como no leído, lo marcamos como leído
    if (detailedMessage.isUnread) {
      await markMessageAsRead(gmailClient, messageId);
    }

    return NextResponse.json({ message: detailedMessage });
  } catch (error: any) {
    // Si es un error de autenticación (token expirado), refrescar el token
    if (error.response?.status === 401) {
      try {
        const newAccessToken = await refreshAccessToken(
          emailAccount.refresh_token
        );

        if (newAccessToken) {
          gmailClient = getGmailClient(newAccessToken);
          await supabase
            .from("email_accounts")
            .update({ access_token: newAccessToken })
            .eq("user_id", userId)
            .eq("email", email);
        }

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
