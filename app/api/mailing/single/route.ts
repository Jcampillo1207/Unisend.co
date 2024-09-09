import { getGmailClient } from "@/lib/gmail-client";
import { createAdminClient } from "@/lib/supabase/server-role";
import { NextResponse } from "next/server";
import { refreshAccessToken } from "@/lib/refrsh-access-token";

async function getMessageDetails(gmailClient: any, messageId: string) {
  const response = await gmailClient.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const message = response.data;
  const headers = message.payload.headers;

  console.log("Headers:", headers);
  console.log("Message:", message);

  const getHeader = (name: string) =>
    headers.find(
      (header: any) => header.name.toLowerCase() === name.toLowerCase()
    )?.value;

  let textBody = "";
  let htmlBody = "";
  const inlineImages: any[] = [];
  const attachments: any[] = [];

  function processPartRecursive(part: any) {
    const mimeType = part.mimeType;
    const body = part.body;

    if (mimeType === "text/plain" && body.data) {
      textBody += Buffer.from(body.data, "base64").toString("utf-8");
    } else if (mimeType === "text/html" && body.data) {
      htmlBody += Buffer.from(body.data, "base64").toString("utf-8");
    } else if (mimeType.startsWith("image/")) {
      inlineImages.push({
        filename: part.filename,
        mimeType: mimeType,
        contentId: part.headers?.find(
          (header: any) => header.name.toLowerCase() === "content-id"
        )?.value,
        data: body.attachmentId || body.data,
      });
    } else if (part.filename && body.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: mimeType,
        attachmentId: body.attachmentId,
      });
    }

    if (part.parts) {
      part.parts.forEach(processPartRecursive);
    }
  }

  processPartRecursive(message.payload);

  console.log("Message structure:", JSON.stringify(message.payload, null, 2));
  console.log("Processed content:");
  console.log("Text body:", textBody.substring(0, 100) + "...");
  console.log("HTML body:", htmlBody.substring(0, 100) + "...");
  console.log("Inline images:", inlineImages.length);
  console.log("Attachments:", attachments.length);

  return {
    id: message.id,
    threadId: message.threadId,
    from: getHeader("From") || "Desconocido",
    subject: getHeader("Subject") || "Sin Asunto",
    date: getHeader("Date"),
    textBody,
    htmlBody,
    inlineImages,
    attachments,
    isUnread: message.labelIds.includes("UNREAD"),
  };
}

async function markMessageAsRead(gmailClient: any, messageId: string) {
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
    console.log(
      "No se proporcionaron el ID de usuario o el ID del mensaje",
      userId,
      messageId
    );
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
    console.error("Error al obtener la cuenta de correo", error);
    return NextResponse.json(
      { error: "Cuenta de correo no encontrada" },
      { status: 400 }
    );
  }

  let gmailClient = getGmailClient(emailAccount.access_token);

  try {
    let detailedMessage = await getMessageDetails(gmailClient, messageId);

    if (detailedMessage.isUnread) {
      console.log("Marcando como leido el correo", messageId);
      await markMessageAsRead(gmailClient, messageId);
    }

    console.log(
      "Devolver el contenido del mensaje",
      JSON.stringify(detailedMessage, null, 2)
    );
    return NextResponse.json({ message: detailedMessage });
  } catch (error: any) {
    if (error.response?.status === 401) {
      try {
        console.log("Token expirado, intentando refrescarlo");
        const newAccessToken = await refreshAccessToken(
          emailAccount.refresh_token
        );

        if (newAccessToken) {
          console.log("Actualizando el token de acceso");
          gmailClient = getGmailClient(newAccessToken);
          await supabase
            .from("email_accounts")
            .update({ access_token: newAccessToken })
            .eq("user_id", userId)
            .eq("email", email);

          const detailedMessage = await getMessageDetails(
            gmailClient,
            messageId
          );

          if (detailedMessage.isUnread) {
            console.log("Marcando como leido el correo", messageId);
            await markMessageAsRead(gmailClient, messageId);
          }

          console.log(
            "Devolver el contenido del mensaje",
            JSON.stringify(detailedMessage, null, 2)
          );
          return NextResponse.json({ message: detailedMessage });
        }
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
