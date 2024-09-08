"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "date-fns";
import { es } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { HeaderAside } from "./header-aside";

export interface Email {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  isUnread: boolean; // Nuevo campo para indicar si no ha sido leído
}

export const AsideMailing = ({ user_id }: { user_id: string }) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false); // Para manejar la carga de más correos
  const router = useRouter();
  const pathname = usePathname();

  const activePath = pathname?.split("/").pop();

  const emailParam = useSearchParams().get("email");
  const containerRef = useRef<HTMLDivElement>(null); // Referencia al contenedor de scroll

  const fetchEmails = async (pageToken?: string) => {
    try {
      setLoading(pageToken ? false : true); // Si es la primera carga, setLoading es true, si es paginación, false
      setLoadingMore(pageToken ? true : false); // Solo mostrar "Cargando más" cuando sea paginación

      const response = await fetch(
        `/api/mailing/list?userid=${user_id}&email=${emailParam}${
          pageToken ? `&pageToken=${pageToken}` : ""
        }`
      );

      if (!response.ok) {
        throw new Error("Error al obtener los correos", { cause: response });
      }

      const data = await response.json();

      setEmails((prevEmails) => [...prevEmails, ...data.messages]);
      setNextPageToken(data.nextPageToken || null); // Actualizar el token de la siguiente página
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
      setLoadingMore(false); // Finalizar la carga de más correos
    }
  };

  // Función para marcar un correo como leído en la UI
  const markEmailAsReadInUI = (emailId: string) => {
    setEmails((prevEmails) =>
      prevEmails.map((email) =>
        email.id === emailId ? { ...email, isUnread: false } : email
      )
    );
  };

  // Efecto para cargar los correos inicialmente
  useEffect(() => {
    if (emailParam) {
      fetchEmails();
    }
  }, [emailParam]);

  // Función para detectar cuando el usuario llega al final del scroll
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (
        scrollTop + clientHeight >= scrollHeight - 10 &&
        nextPageToken &&
        !loadingMore
      ) {
        // Cuando llegamos al final del scroll, cargamos más correos
        fetchEmails(nextPageToken);
      }
    }
  };

  // Agregar un listener para el scroll cuando el componente se monta
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [nextPageToken, loadingMore]); // Solo volver a añadir el evento si el token cambia o se está cargando más

  if (loading && emails.length === 0) {
    return (
      <aside
        ref={containerRef}
        className="w-full border-r items-start justify-start max-w-sm flex flex-col relative h-dvh min-h-dvh max-h-dvh overflow-x-hidden overflow-y-scroll no-scrollbar shrink-0"
      >
        <HeaderAside />
        <div className="w-full h-fit items-start justify-start p-5 space-y-2.5">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton
              key={index}
              className="w-full aspect-[16/4] items-center justify-between flex bg-muted/80"
            />
          ))}
        </div>
      </aside>
    );
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  console.log(emails);

  return (
    <aside
      ref={containerRef}
      className="w-full border-r items-start justify-start max-w-sm flex flex-col relative h-dvh min-h-dvh max-h-dvh overflow-x-hidden overflow-y-scroll no-scrollbar shrink-0"
    >
      <HeaderAside />

      {emails.length > 0 ? (
        <div className="w-full h-fit items-start justify-start">
          {emails.map((email: Email, key: number) => (
            <div
              onClick={() => {
                markEmailAsReadInUI(email.id); // Marcar como leído en la UI
                router.push(
                  `/mailing/${email.id}?email=${emailParam}&sender=${email.from}`
                );
              }}
              key={key}
              role="button"
              className={cn(
                "px-4 py-2.5 border-t hover:bg-muted cursor-pointer transition-all flex gap-x-2.5",
                key === 0 && "border-t-0",
                email.isUnread && "bg-muted/50",
                activePath == email.id && "bg-primary/30 hover:bg-primary/40"
              )}
            >
              {/* Mostrar la línea morada solo si el correo no ha sido leído */}
              <div
                className={cn(
                  "flex-1 max-w-[2px] items-start shrink-0 min-w-[2px] rounded-full",
                  email.isUnread ? "bg-primary" : "bg-transparent",
                  activePath == email.id && "text-foreground"
                )}
              ></div>
              <div className="w-full h-fit items-start justify-start flex flex-col gap-y-0.5">
                <div
                  className={cn(
                    "text-base font-semibold text-muted-foreground max-w-full truncate",
                    email.isUnread && "text-foreground",
                    activePath == email.id && "text-foreground"
                  )}
                >
                  {email.from
                    .replace(/<(.*)>/, "")
                    .replace(/"/g, "")
                    .trim()}
                </div>
                <div
                  className={cn(
                    "text-sm antialiased text-muted-foreground",
                    activePath == email.id && "text-foreground"
                  )}
                >
                  {email.subject}
                </div>
                <div
                  className={cn(
                    "text-xs text-gray-600",
                    activePath == email.id && "text-foreground"
                  )}
                >
                  {email.snippet}
                </div>
                <span
                  className={cn(
                    "w-full items-center justify-between flex text-muted-foreground",
                    activePath == email.id && "text-foreground"
                  )}
                >
                  <Label>
                    {formatDate(email.date, "LLL dd, yyyy", { locale: es })}
                  </Label>
                </span>
              </div>
            </div>
          ))}
          {loadingMore && (
            <div className="w-full items-center justify-center flex py-5">
              <Loader className="size-4 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <p>No hay correos disponibles.</p>
      )}
    </aside>
  );
};
