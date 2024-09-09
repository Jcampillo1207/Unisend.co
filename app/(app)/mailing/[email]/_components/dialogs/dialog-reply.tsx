"use client";

import { useState, ChangeEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css"; // Estilos para React Quill
import { useSearchParams } from "next/navigation";

// Carga dinámica de React Quill para evitar problemas con el renderizado del servidor
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export const ReplyDialog = ({
  emailId,
  userId,
  open,
  setOpen,
  emailSender,
}: {
  emailId: string;
  userId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  emailSender: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState(""); // Contenido del editor
  const [attachments, setAttachments] = useState<File[]>([]); // Archivos adjuntos
  const email = useSearchParams().get("email") as string;

  // Configuración del editor React Quill
  const quillModules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image", "video"], // Añadimos soporte para imágenes
        ["clean"], // Limpiar formato
      ],
    },
  };

  // Manejo de envío de respuesta
  const sendReply = async () => {
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("emailId", emailId);
    formData.append("userId", userId);
    formData.append("replyBody", replyBody); // Aquí va el contenido del editor
    formData.append("sender", emailSender);
    formData.append("email", email);

    // Adjuntar archivos
    attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    try {
      const response = await fetch("/api/mailing/reply", {
        method: "POST",
        body: formData, // FormData incluye los archivos y los datos
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage("Error al enviar la respuesta");
    } finally {
      setLoading(false);
    }
  };

  ;

  // Manejo de archivos adjuntos
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  // Eliminar un archivo adjunto
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-5xl max-h-[80dvh] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Responder al correo</DialogTitle>
          <DialogDescription>
            Escribe tu respuesta y adjunta archivos si es necesario.
          </DialogDescription>
        </DialogHeader>

        {/* Editor de texto enriquecido para el cuerpo del correo */}
        <div className="w-full h-[60vh] items-start justify-start flex flex-1 mb-4">
          <ReactQuill
            value={replyBody}
            onChange={setReplyBody}
            modules={quillModules}
            placeholder="Escribe tu respuesta..."
          />
        </div>

        {/* Botones para agregar archivos adjuntos */}
        <div className="h-fit">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Adjuntar archivos (imágenes, documentos, etc.):
          </label>
          <Input
            type="file"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500"
          />
        </div>

        {/* Mostrar archivos adjuntos */}
        {attachments.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium">Archivos adjuntos:</h4>
            <ul className="list-disc list-inside">
              {attachments.map((file, index) => (
                <li key={index}>
                  {file.name}{" "}
                  <button
                    className="text-red-500 hover:underline ml-2"
                    onClick={() => removeAttachment(index)}
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter className="border-t pt-5">
          {/* Mensaje de estado (enviando o error/success) */}
          {loading ? (
            <p className="text-blue-500">Enviando...</p>
          ) : (
            message && <p className="text-green-500">{message}</p>
          )}

          {/* Botón para enviar la respuesta */}
          <div className="flex justify-end">
            <Button
              onClick={sendReply}
              variant="default"
              size="default"
              disabled={loading}
            >
              Enviar Respuesta
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
