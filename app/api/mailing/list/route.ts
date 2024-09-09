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
  category: string;
  labelIds: string[];
  hasAttachment: boolean;
}

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

  const isUnread = labelIds.includes("UNREAD");
  const hasAttachment =
    payload.parts?.some((part) => part.filename && part.filename.length > 0) ||
    false;

  let category = "Primary";
  if (labelIds.includes("CATEGORY_SOCIAL")) {
    category = "Social";
  } else if (labelIds.includes("CATEGORY_PROMOTIONS")) {
    category = "Promotions";
  } else if (labelIds.includes("CATEGORY_UPDATES")) {
    category = "Updates";
  } else if (labelIds.includes("CATEGORY_FORUMS")) {
    category = "Forums";
  } else if (labelIds.includes("SPAM")) {
    category = "Spam";
  }

  return {
    id: messageId,
    from,
    subject,
    date: dateHeader,
    body: Buffer.from(body, "base64").toString("utf-8"),
    isUnread,
    labelIds,
    category,
    hasAttachment,
  };
}

function getCategoryLabel(category: string | null): string {
  switch (category) {
    case "Primary":
      return "INBOX";
    case "Social":
      return "CATEGORY_SOCIAL";
    case "Promotions":
      return "CATEGORY_PROMOTIONS";
    case "Updates":
      return "CATEGORY_UPDATES";
    case "Forums":
      return "CATEGORY_FORUMS";
    case "Spam":
      return "SPAM";
    default:
      return "INBOX";
  }
}

export async function GET(req: Request) {
  const supabase = createAdminClient();
  const url = new URL(req.url);
  const userId = url.searchParams.get("userid");
  const email = url.searchParams.get("email");
  const pageToken = url.searchParams.get("pageToken");
  const category = url.searchParams.get("category");
  const unreadOnly = url.searchParams.get("f") === "true";
  const hasAttachment = url.searchParams.get("hasAttachment") === "true";
  const isImportant = url.searchParams.get("isImportant") === "true";
  const date = url.searchParams.get("date");
  const q = url.searchParams.get("q");

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
    const labelId = getCategoryLabel(category);
    let queryString = [];

    if (unreadOnly) queryString.push("is:unread");
    if (hasAttachment) queryString.push("has:attachment");
    if (isImportant) queryString.push("is:important");
    if (date) queryString.push(`after:${date} before:${date}`);
    if (q) queryString.push(q);

    const response = await gmailClient.users.messages.list({
      userId: "me",
      maxResults: 12,
      includeSpamTrash: true,
      labelIds: [labelId],
      q: queryString.join(" "),
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

    // Aplicar filtros adicionales si es necesario
    const filteredMessages = detailedMessages.filter((msg) => {
      if (hasAttachment && !msg.hasAttachment) return false;
      if (date && new Date(msg.date!).toISOString().split("T")[0] !== date)
        return false;
      if (q) {
        const searchTerms = q.toLowerCase().split(" ");
        const messageContent =
          `${msg.subject} ${msg.from} ${msg.body}`.toLowerCase();
        return searchTerms.every((term) => messageContent.includes(term));
      }
      return true;
    });

    return NextResponse.json({ messages: filteredMessages, nextPageToken });
  } catch (error: any) {
    console.error("Error al listar correos:", error);

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

          const labelId = getCategoryLabel(category);
          let queryString = [];

          if (unreadOnly) queryString.push("is:unread");
          if (hasAttachment) queryString.push("has:attachment");
          if (isImportant) queryString.push("is:important");
          if (date) queryString.push(`after:${date} before:${date}`);
          if (q) queryString.push(q);

          const response = await gmailClient.users.messages.list({
            userId: "me",
            maxResults: 12,
            includeSpamTrash: true,
            labelIds: [labelId],
            q: queryString.join(" "),
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
            messages.map((message) =>
              getMessageDetails(gmailClient, message.id!)
            )
          );

          // Aplicar filtros adicionales si es necesario
          const filteredMessages = detailedMessages.filter((msg) => {
            if (hasAttachment && !msg.hasAttachment) return false;
            if (
              date &&
              new Date(msg.date!).toISOString().split("T")[0] !== date
            )
              return false;
            if (q) {
              const searchTerms = q.toLowerCase().split(" ");
              const messageContent =
                `${msg.subject} ${msg.from} ${msg.body}`.toLowerCase();
              return searchTerms.every((term) => messageContent.includes(term));
            }
            return true;
          });

          return NextResponse.json({
            messages: filteredMessages,
            nextPageToken,
          });
        }
      } catch (refreshError) {
        console.error("Error al refrescar el token:", refreshError);
        return NextResponse.json(
          { error: "Error al refrescar el token" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Error al listar correos" },
      { status: 500 }
    );
  }
}
