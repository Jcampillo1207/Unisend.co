import { getGmailClient } from "@/lib/gmail-client";
import { refreshAccessToken } from "@/lib/refrsh-access-token";
import { createAdminClient } from "@/lib/supabase/server-role";
import { NextResponse } from "next/server";

interface EmailAccount {
  access_token: string;
  refresh_token: string;
}

// Función para obtener el contenido y detalles de un correo
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

  const body =
    payload?.parts?.find((part: any) => part.mimeType === "text/plain")?.body
      ?.data || "Sin contenido";

  // Determinar si el mensaje está marcado como no leído
  const isUnread = labelIds.includes("UNREAD");

  // console.log(payload)

  return {
    id: messageId,
    from,
    subject,
    date: dateHeader,
    body: Buffer.from(body, "base64").toString("utf-8"), // Decodificar el contenido de base64
    isUnread, // Agregamos el estado de lectura al objeto retornado
  };
}

export async function GET(req: Request) {
  const supabase = createAdminClient();
  const url = new URL(req.url);
  const userId = url.searchParams.get("userid");
  const email = url.searchParams.get("email");
  const pageToken = url.searchParams.get("pageToken"); // Token para la paginación

  if (!userId) {
    return NextResponse.json(
      { error: "ID de usuario no proporcionado" },
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
    // Añadir el `pageToken` a la solicitud de mensajes para obtener la siguiente página si es necesario
    const response = await gmailClient.users.messages.list({
      userId: "me",
      maxResults: 20,
      pageToken: pageToken || undefined,
    });

    const { messages, nextPageToken, resultSizeEstimate } = response.data;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron mensajes" },
        { status: 404 }
      );
    }

    const detailedMessages = await Promise.all(
      messages.map((message: any) => getMessageDetails(gmailClient, message.id))
    );

    // Devolver los mensajes y el nextPageToken para la siguiente solicitud
    return NextResponse.json({ messages: detailedMessages, nextPageToken });
  } catch (error: any) {
    console.error("Error al listar correos:", error);
    return NextResponse.json(
      { error: "Error al listar correos" },
      { status: 500 }
    );
  }
}
