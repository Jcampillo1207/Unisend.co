import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email_id } = await req.json();

  if (!email_id || typeof email_id !== "string") {
    return NextResponse.json(
      { error: "Falta el ID del correo" },
      { status: 400 }
    );
  }

  // Lógica para marcar como spam el correo
  return NextResponse.json(
    { message: `Marcado como spam el correo con ID: ${email_id}` },
    { status: 200 }
  );
}
