import { NextResponse } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export async function POST(request: Request) {
  const { prompt, mood, action } = await request.json();

  let aiPrompt;
  if (action === "changeMood") {
    aiPrompt = `Reescribe el siguiente correo electrónico manteniendo el mismo contenido pero ajustando el tono para que sea ${mood}:
${prompt}
Instrucciones importantes:
- Mantén la estructura y el contenido general del correo original.
- Ajusta el lenguaje y las expresiones para reflejar el nuevo tono ${mood}.
- No agregues información nueva ni cambies el significado del mensaje.
- Usa "\\n" para representar los saltos de línea en tu respuesta.
- No incluyas etiquetas HTML ni formateo especial.

El resultado debe ser un texto que mantenga la esencia del correo original pero con el nuevo tono solicitado.`;
  } else {
    aiPrompt = `Escribe un correo electrónico utilizando como base el siguiente texto: "${prompt}".
El tono que debe llevar el correo es el siguiente: ${mood}
Instrucciones importantes:
- Utiliza párrafos completos y coherentes.
- No incluyas saltos de línea innecesarios dentro de las oraciones o palabras.
- No dividas palabras o frases a mitad de línea.
- No incluyas etiquetas HTML ni formateo especial.
- Asegúrate de que el texto sea fluido y fácil de leer.
- Usa "\\n" para representar los saltos de línea en tu respuesta.

El resultado debe ser un texto limpio y bien estructurado, siguiendo exactamente el formato especificado arriba, listo para ser insertado en un editor de texto sin necesidad de correcciones adicionales.`;
  }

  try {
    const stream = streamText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      maxTokens: 1000,
      temperature: 0.5,
      maxRetries: 5,
      prompt: aiPrompt,
    });

    return new Response((await stream).textStream, {
      headers: {
        "Content-Type": "text/plain",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error in AI stream:", error);
    return NextResponse.json(
      { error: "Error generating email content" },
      { status: 500 }
    );
  }
}
