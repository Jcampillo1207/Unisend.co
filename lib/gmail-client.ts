// lib/google/gmail-client.ts
import { google } from "googleapis";

export function getGmailClient(accessToken: string) {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );
  oAuth2Client.setCredentials({
    access_token: accessToken,
  });

  return google.gmail({ version: "v1", auth: oAuth2Client });
}
