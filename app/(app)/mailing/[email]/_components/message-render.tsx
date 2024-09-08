"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ShadowContent from "./shadow-content";

// Tipos
type InlineImage = {
  filename: string;
  mimeType: string;
  contentId: string;
  data: string;
};

type Attachment = {
  filename: string;
  mimeType: string;
  attachmentId: string;
};

type MessageData = {
  id: string;
  from: string;
  subject: string;
  date: string;
  textBody: string;
  htmlBody: string;
  inlineImages: InlineImage[];
  attachments: Attachment[];
  isUnread: boolean;
};

type MessageRenderProps = {
  data: MessageData | null;
  className?: string; // Clase para el contenedor principal
  titleClassName?: string; // Clase para el título del mensaje
  fromClassName?: string; // Clase para la línea de "De"
  dateClassName?: string; // Clase para la línea de la fecha
  bodyClassName?: string; // Clase para el cuerpo del mensaje
  inlineImageClassName?: string; // Clase para las imágenes embebidas
  attachmentClassName?: string; // Clase para los adjuntos
};

// Componente para renderizar enlaces con clase personalizada
const CustomLink: React.FC<{
  href: string;
  children: React.ReactNode;
  className?: string;
}> = ({ href, children, className = "" }) => (
  <Link
    href={href}
    className={`text-primary hover:underline break-all ${className}`}
    target="_blank"
    rel="noopener noreferrer"
  >
    {children}
  </Link>
);

// Función para convertir URLs en texto plano a enlaces clicables
const linkify = (text: string, linkClassName?: string): React.ReactNode[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) =>
    part.match(urlRegex) ? (
      <CustomLink key={index} href={part} className={linkClassName}>
        {part}
      </CustomLink>
    ) : (
      part
    )
  );
};

// Componente para mostrar imágenes embebidas con clase personalizada
const InlineImage: React.FC<{ image: InlineImage; className?: string }> = ({
  image,
  className = "",
}) => (
  <img
    src={`data:${image.mimeType};base64,${image.data}`}
    alt={image.filename}
    className={`inline-image ${className}`}
  />
);

// Componente para mostrar adjuntos con clase personalizada
const AttachmentLink: React.FC<{
  attachment: Attachment;
  className?: string;
}> = ({ attachment, className = "" }) => (
  <a
    href={`/attachments/${attachment.attachmentId}`} // Debes manejar la descarga de archivos por ID
    className={`text-primary hover:underline ${className}`}
    download={attachment.filename}
  >
    {attachment.filename}
  </a>
);

// Componente principal
export const MessageRender: React.FC<MessageRenderProps> = ({
  data,
  className = "",
  titleClassName = "",
  fromClassName = "",
  dateClassName = "",
  bodyClassName = "",
  inlineImageClassName = "",
  attachmentClassName = "",
}) => {
  const [showPlainText, setShowPlainText] = useState(false);

  if (!data) {
    return null;
  }

  // Verificar si tenemos HTML disponible
  const hasHtmlBody = data.htmlBody && data.htmlBody.trim().length > 0;
  const hasTextBody = data.textBody && data.textBody.trim().length > 0;

  return (
    <div
      className={`items-start justify-start flex flex-col w-full relative ${className}`}
    >
      <div className="w-full h-fit items-start justify-start flex flex-col gap-y-0.5 lg:gap-y-1 xl:gap-y-1.5 px-5 md:px-7 lg:px-14 py-5 lg:py-7 xl:py-10 border-b bg-muted">
        {(data.subject && (
          <h1
            className={`text-2xl font-bold text-foreground ${titleClassName}`}
          >
            {data.subject}
          </h1>
        )) || (
          <h1
            className={`text-2xl font-bold text-foreground ${titleClassName}`}
          >
            Sin asunto
          </h1>
        )}
        <p className={`text-sm text-muted-foreground ${fromClassName}`}>
          De: {data.from}
        </p>
        <p className={`text-sm text-muted-foreground ${dateClassName}`}>
          Fecha: {format(new Date(data.date), "dd/MM/yyyy HH:mm")}
        </p>
        <div className="w-full h-fit items-center justify-between flex">
          {hasHtmlBody && hasTextBody && (
            <Button onClick={() => setShowPlainText((prev) => !prev)}>
              {showPlainText ? "Ver HTML" : "Ver Texto Plano"}
            </Button>
          )}
        </div>
      </div>

      {/* Renderizar el cuerpo del correo */}
      <div className={`text-base ${showPlainText && "prose"} ${bodyClassName}`}>
        {showPlainText ? (
          // Mostrar el cuerpo de texto plano
          hasTextBody &&
          data.textBody.split("\n\n").map((paragraph, index) => (
            <p key={index} className="mb-4 whitespace-pre-wrap">
              {linkify(paragraph)}
            </p>
          ))
        ) : // Mostrar HTML si está disponible
        hasHtmlBody ? (
          <div className="w-full h-fit">
            <ShadowContent html={data.htmlBody} />
          </div>
        ) : (
          hasTextBody &&
          data.textBody.split("\n\n").map((paragraph, index) => (
            <p key={index} className="mb-4 whitespace-pre-wrap">
              {linkify(paragraph)}
            </p>
          ))
        )}
      </div>

      {/* Renderizar imágenes embebidas */}
      {data.inlineImages.length > 0 && (
        <div className={`inline-images mt-4 ${inlineImageClassName}`}>
          <h2 className="text-lg font-semibold mb-2">Imágenes embebidas:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.inlineImages.map((image, index) => (
              <InlineImage
                key={index}
                image={image}
                className={inlineImageClassName}
              />
            ))}
          </div>
        </div>
      )}

      {/* Renderizar archivos adjuntos */}
      {data.attachments.length > 0 && (
        <div className={`attachments mt-4 ${attachmentClassName}`}>
          <h2 className="text-lg font-semibold mb-2">Archivos adjuntos:</h2>
          <ul>
            {data.attachments.map((attachment, index) => (
              <li key={index}>
                <AttachmentLink
                  attachment={attachment}
                  className={attachmentClassName}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
