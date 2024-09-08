import { getGmailClient } from "@/lib/gmail-client";
import { refreshAccessToken } from "@/lib/refrsh-access-token";
import { createAdminClient } from "@/lib/supabase/server-role";
import { NextResponse } from "next/server";
import { gmail_v1 } from "googleapis";

interface EmailAccount {
  access_token: string;
  refresh_token: string;
}

interface MessageDetails {
  id: string;
  from: string;
  subject: string;
  date: string | null;
  body: string;
  isUnread: boolean;
}

// Function to get the content and details of an email
async function getMessageDetails(
  gmailClient: gmail_v1.Gmail,
  messageId: string
): Promise<MessageDetails> {
  const response = await gmailClient.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const payload = response.data.payload!;
  const headers = payload.headers!;
  const labelIds = response.data.labelIds || [];
  const dateHeader =
    headers.find((header) => header.name === "Date")?.value || null;

  const from =
    headers.find((header) => header.name === "From")?.value || "Desconocido";
  const subject =
    headers.find((header) => header.name === "Subject")?.value || "Sin Asunto";

  const body =
    payload.parts?.find((part) => part.mimeType === "text/plain")?.body?.data ||
    "Sin contenido";

  // Determine if the message is marked as unread
  const isUnread = labelIds.includes("UNREAD");

  return {
    id: messageId,
    from,
    subject,
    date: dateHeader,
    body: Buffer.from(body, "base64").toString("utf-8"), // Decode content from base64
    isUnread,
  };
}

export async function GET(req: Request) {
  const supabase = createAdminClient();
  const url = new URL(req.url);
  const userId = url.searchParams.get("userid");
  const email = url.searchParams.get("email");
  const pageToken = url.searchParams.get("pageToken"); // Token for pagination

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
    // Add the `pageToken` to the message request to get the next page if necessary
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
      messages.map((message) => getMessageDetails(gmailClient, message.id!))
    );

    // Return messages and nextPageToken for the next request
    return NextResponse.json({ messages: detailedMessages, nextPageToken });
  } catch (error) {
    console.error("Error al listar correos:", error);
    return NextResponse.json(
      { error: "Error al listar correos" },
      { status: 500 }
    );
  }
}
