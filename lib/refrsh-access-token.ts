// lib/google/refresh-token.ts
import { google } from "googleapis";

export async function refreshAccessToken(refreshToken: string) {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );

  oAuth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  try {
    const { credentials } = await oAuth2Client.refreshAccessToken();
    return credentials.access_token;
  } catch (error) {
    console.error("Error al refrescar el access token:", error);
    throw new Error("Error al refrescar el access token.");
  }
}
