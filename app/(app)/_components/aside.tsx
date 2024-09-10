"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader, MailX } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { HeaderAside } from "./header-aside";
import { FiltersAside } from "./filters-aside";

export interface Email {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  isUnread: boolean;
  category: string;
}

export const AsideMailing = ({ user_id }: { user_id: string }) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activePath = pathname?.split("/").pop();
  const categoryParam = searchParams.get("category");
  const emailParam = searchParams.get("emailroute");
  const filterUnread = searchParams.get("f") === "true";
  const hasAttachment = searchParams.get("hasAttachment") === "true";
  const isImportant = searchParams.get("isImportant") === "true";
  const date = searchParams.get("date");
  const q = searchParams.get("q");
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchEmails = async (pageToken?: string) => {
    try {
      setLoading(pageToken ? false : true);
      setLoadingMore(pageToken ? true : false);

      const url = new URL(`/api/mailing/list`, window.location.origin);
      url.searchParams.append("userid", user_id);
      url.searchParams.append("email", emailParam || "");
      url.searchParams.append("category", categoryParam || "");
      if (pageToken) url.searchParams.append("pageToken", pageToken);
      if (filterUnread) url.searchParams.append("f", "true");
      if (hasAttachment) url.searchParams.append("hasAttachment", "true");
      if (isImportant) url.searchParams.append("isImportant", "true");
      if (date) url.searchParams.append("date", date);
      if (q) url.searchParams.append("q", q);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error("Error al obtener los correos", { cause: response });
      }

      const data = await response.json();

      setEmails((prevEmails) =>
        pageToken ? [...prevEmails, ...data.messages] : data.messages
      );
      setNextPageToken(data.nextPageToken || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const markEmailAsReadInUI = (emailId: string) => {
    setEmails((prevEmails) =>
      prevEmails.map((email) =>
        email.id === emailId ? { ...email, isUnread: false } : email
      )
    );
  };

  useEffect(() => {
    if (emailParam) {
      setEmails([]);
      fetchEmails();
    }
  }, [
    emailParam,
    categoryParam,
    filterUnread,
    hasAttachment,
    isImportant,
    date,
    q,
  ]);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (
        scrollTop + clientHeight >= scrollHeight - 10 &&
        nextPageToken &&
        !loadingMore
      ) {
        fetchEmails(nextPageToken);
      }
    }
  };

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
  }, [nextPageToken, loadingMore]);

  const centerSelectedEmail = (emailId: string) => {
    const emailElement = document.getElementById(`email-${emailId}`);
    if (emailElement && containerRef.current) {
      const containerHeight = containerRef.current.clientHeight;
      const emailTop = emailElement.offsetTop;
      const emailHeight = emailElement.clientHeight;
      const scrollTop = emailTop - containerHeight / 2 + emailHeight / 2;

      containerRef.current.scrollTo({
        top: scrollTop,
        behavior: "smooth",
      });
    }
  };

  const formatEmailDate = (date: string | number | Date) => {
    const emailDate = new Date(date);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - emailDate.getTime()) / 36e5;

    if (diffInHours < 24) {
      return formatDistanceToNow(emailDate, { addSuffix: true, locale: es });
    } else if (diffInHours < 48) {
      return "ayer";
    } else {
      return formatDate(emailDate, "LLL dd, yyyy HH:mm", { locale: es });
    }
  };

  if (loading && emails.length === 0) {
    return (
      <aside
        ref={containerRef}
        className="w-full border-r items-start justify-start max-w-sm flex flex-col relative h-dvh min-h-dvh max-h-dvh overflow-x-hidden overflow-y-scroll no-scrollbar shrink-0"
      >
        <HeaderAside />
        <FiltersAside />
        <div className="w-full h-fit items-start justify-start p-5 space-y-2.5">
          {Array.from({ length: 12 }).map((_, index) => (
            <Skeleton
              key={index}
              className={cn(
                "w-full aspect-[16/4] flex bg-muted/80",
                "delay-[" + index + index * 0.5 + "ms]"
              )}
            />
          ))}
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="w-full border-r items-start justify-start max-w-sm flex flex-col relative h-dvh min-h-dvh max-h-dvh overflow-x-hidden overflow-y-scroll no-scrollbar shrink-0">
        <HeaderAside />
        <FiltersAside />
        <div className="w-full h-auto items-center justify-center p-5 flex-1 flex flex-col gap-y-3 px-4">
          <div className="w-fit h-fit aspect-square p-2.5 rounded-xl border border-destructive bg-destructive/20">
            <MailX className="size-6 text-destructive" />
          </div>
          <p className="text-center text-sm antialiased text-muted-foreground">
            Hubo un error inesperado,
            <br /> intenta refrescar la página.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside
      ref={containerRef}
      className={cn(
        "w-full border-r items-start justify-start max-w-sm flex flex-col relative h-dvh min-h-dvh max-h-dvh overflow-x-hidden overflow-y-scroll shrink-0 snap-y snap-mandatory scroll-smooth no-scrollbar"
      )}
    >
      <HeaderAside />
      <FiltersAside />
      {emails.length > 0 ? (
        <div className="w-full h-fit items-start justify-start">
          {emails.map((email: Email, key: number) => (
            <div
              onClick={() => {
                markEmailAsReadInUI(email.id);
                router.push(
                  `/mailing/${email.id}?emailroute=${emailParam}&sender=${
                    email.from
                  }${categoryParam ? `&category=${categoryParam}` : ""}${
                    date ? `&date=${date}` : ""
                  }${isImportant ? "&isImportant=true" : ""}${
                    hasAttachment ? "&hasAttachment=true" : ""
                  }${filterUnread ? "&f=true" : ""}${q ? `&q=${q}` : ""}`
                );
                centerSelectedEmail(email.id);
              }}
              id={`email-${email.id}`}
              key={key}
              role="button"
              className={cn(
                "px-4 py-2.5 border-t hover:bg-muted cursor-pointer transition-all flex gap-x-2.5 snap-end",
                key === 0 && "border-t-0",
                email.isUnread && "bg-muted/50",
                activePath == email.id && "dark:bg-primary/30 dark:hover:bg-primary/40 bg-primary/10 hover:bg-primary/20"
              )}
            >
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
                  <Label className="cursor-pointe italic text-xs">
                    {formatEmailDate(email.date)}
                  </Label>
                </span>
              </div>
            </div>
          ))}
          {loadingMore && (
            <div className="w-full items-center justify-center flex py-5 snap-end">
              <Loader className="size-4 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-fit items-start justify-start p-5 space-y-2.5">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton
              key={index}
              className="w-full aspect-[16/4] items-center justify-between flex bg-muted/80"
            />
          ))}
        </div>
      )}
    </aside>
  );
};
