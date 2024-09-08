// lib/google-auth.ts
import { google, gmail_v1 } from "googleapis";
import { OAuth2Client, Credentials } from "google-auth-library";

const oAuth2Client: OAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "https://unisend.co/api/auth/callback/google" // URL de redirección para tu app
);

export function getAuthUrl(userId: string): string {
  const scopes: string[] = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.labels",
  ];

  // Generar la URL de autorización de Google, incluyendo el user_id en la URL de redirección
  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state: userId, // Agrega el userId en el estado para que lo recibas en el callback
  });
}

export async function getAccessToken(code: string): Promise<{
  email: string;
  access_token: string | null;
  refresh_token: string | null;
}> {
  try {
    const { tokens }: { tokens: Credentials } = await oAuth2Client.getToken(
      code
    );
    oAuth2Client.setCredentials(tokens);

    // Obtener el perfil del usuario (email)
    const gmail: gmail_v1.Gmail = google.gmail({
      version: "v1",
      auth: oAuth2Client,
    });
    const profile = await gmail.users.getProfile({ userId: "me" });

    return {
      email: profile.data.emailAddress ?? "",
      access_token: tokens.access_token ?? null,
      refresh_token: tokens.refresh_token ?? null,
    };
  } catch (error) {
    console.error("Error al obtener el token de acceso:", error);
    throw new Error("Error al obtener el token de acceso.");
  }
}
