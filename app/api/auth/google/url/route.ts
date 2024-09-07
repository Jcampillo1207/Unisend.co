// app/api/auth/google/url/route.ts

import { getAuthUrl } from "@/lib/google/google-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const urlParams = new URL(req.url);
  const userId = urlParams.searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json(
      { error: "User ID not provided" },
      { status: 400 }
    );
  }

  try {
    // Obtener la URL de autorización de Google y pasar el userId en la URL de redirección
    const googleAuthUrl = getAuthUrl(userId); // Modifica getAuthUrl para aceptar el userId
    return NextResponse.json({ url: googleAuthUrl, userId });
  } catch (error) {
    console.error("Error al obtener la URL de autorización:", error);
    return NextResponse.json(
      { error: "Error al obtener la URL de autorización" },
      { status: 500 }
    );
  }
}
