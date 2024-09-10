"use client";

import { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookDashed, SendIcon, Sparkles } from "lucide-react";
import "react-quill/dist/quill.snow.css";
import FileUploadArea from "./_components/file-upload-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReactQuillEditor } from "./_components/editor/react-quill-editor";
import { cn } from "@/lib/utils";
import EmailInput from "./_components/editor/email-input";
import { MoodChanger } from "./_components/editor/mood-changer";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
const supabase = createClient();
const MailingPage = () => {
  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [mood, setMood] = useState("amigable");
  const [userID, setUserID] = useState("");
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const sender = searchParams.get("sender");
  const emailroute = searchParams.get("emailroute");
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  console.log("Initial params:", { mode, sender, emailroute });

  const sanitizeEmail = (email: string): string => {
    if (!email) return "";
    const match = email.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const result = match ? match[0] : email;
    return result;
  };

  useEffect(() => {
    if (mode === "reply" && sender) {
      const sanitizedEmail = sanitizeEmail(sender);
      setTo([sanitizedEmail]);
    }
  }, [mode, sender]);

  useEffect(() => {
    async function getUserID() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserID(user.id);
      }
    }

    getUserID();
  }, []);

  const handleSend = async () => {
    toast.loading("Enviando correo...");
    // El cuerpo ya está en formato HTML, no necesitamos envolverlo nuevamente

    console.log("Preparando para enviar correo:");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Body:", body);

    try {
      const response = await fetch("/api/mailing/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userID,
          email: searchParams.get("emailroute"),
          to: to.join(","),
          cc,
          bcc,
          subject,
          body,
          attachments,
          mode: searchParams.get("mode"),
          threadId: searchParams.get("threadId"),
          theme,
        }),
      });

      console.log("Respuesta del servidor:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error del servidor:", errorData);
        throw new Error(errorData.error || "Error al enviar el correo");
      }

      const result = await response.json();
      console.log("Correo enviado con éxito:", result.messageId);
      toast.dismiss();
      toast.success("Correo enviado con éxito");
    } catch (error) {
      toast.dismiss();
      console.error("Error al enviar el correo:", error);
      toast.error("Error al enviar el correo");
    }
  };

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    setAttachments((prev) => [...prev, ...newFiles]);
  }, []);

  const handleFileRemoved = useCallback((fileToRemove: File) => {
    setAttachments((prev) => prev.filter((file) => file !== fileToRemove));
  }, []);

  const handleMoodChange = useCallback(
    async (newMood) => {
      setMood(newMood);
      if (body) {
        setLoading(true);
        try {
          const response = await fetch("/api/ai/email-writter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: body,
              mood: newMood,
              action: "changeMood",
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("No reader available");
          }

          let accumulatedContent = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            accumulatedContent += chunk;

            const cleanedContent = accumulatedContent
              .replace(/\\n/g, "\n")
              .replace(/\s+$/, "");

            setBody(cleanedContent);
          }

          const finalContent = accumulatedContent
            .replace(/\\n/g, "\n")
            .replace(/\s+$/, "");

          setBody(finalContent.replace(/\n/g, "<br>"));
        } catch (error) {
          console.error("Error changing email mood:", error);
        } finally {
          setLoading(false);
        }
      }
    },
    [body]
  );

  const handleAIWrite = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/email-writter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: body, mood: mood, action: "rewrite" }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        accumulatedContent += chunk;

        const cleanedContent = accumulatedContent
          .replace(/\\n/g, "\n")
          .replace(/\s+$/, "");

        setBody(cleanedContent);
      }

      const finalContent = accumulatedContent
        .replace(/\\n/g, "\n")
        .replace(/\s+$/, "");

      setBody(finalContent.replace(/\n/g, "<br>"));
    } catch (error) {
      console.error("Error generating email content:", error);
    } finally {
      setLoading(false);
    }
  }, [body, mood]);

  return (
    <div className="w-full h-dvh max-h-dvh min-h-dvh flex bg-background">
      <div className="w-full flex flex-col gap-y-2 bg-muted/50 relative overflow-scroll no-scrollbar">
        <div className="px-4 h-14 items-center justify-between shrink-0 flex border-b sticky top-0 left-0 bg-background z-30">
          <h2 className="text-lg font-semibold">Mensaje nuevo</h2>
          <div className="w-fit h-full flex gap-x-0.5 items-center">
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <BookDashed className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-muted border">
                  Guardar borrador
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="pt-4 flex-1 flex flex-col">
          <div className="flex flex-col gap-y-2 pb-4">
            <div className="flex flex-col gap-y-1.5 px-4">
              <Label htmlFor="to">Para</Label>
              <EmailInput value={to} onChange={setTo} key={to.join(",")} />
            </div>
            <div className="flex flex-col gap-y-1.5 px-4 w-full">
              <Label htmlFor="subject">Asunto</Label>
              <Input
                className="bg-transparent border-0 ring-0 rounded-none focus-visible:ring-0 focus-visible:outline-0 px-0 py-3"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Asunto del correo"
              />
            </div>
          </div>
          <div className="flex-1 h-fit gap-y-1.5 flex flex-col">
            <div className="flex-1 bg-background px-4 py-2 border-y relative">
              {body && (
                <div className="absolute right-4 top-2 w-fit items-center justify-end flex gap-x-0.5">
                  <TooltipProvider>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={loading}
                          onClick={handleAIWrite}
                          className={cn(
                            "text-primary/50 hover:text-foreground",
                            body &&
                              "text-primary bg-primary/20 hover:bg-primary/30 hover:text-primary"
                          )}
                        >
                          <Sparkles className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={5} className="bg-muted border">
                        Mejorar con{" "}
                        <span className="text-[#FF51D9] font-medium">
                          Unisend AI
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <MoodChanger onMoodChange={handleMoodChange} />{" "}
                </div>
              )}

              <ReactQuillEditor value={body} onChange={setBody} />
            </div>
          </div>
          <div className="flex justify-end items-center px-4 h-14 border-t sticky bottom-0 left-0 z-30 bg-[#fafafa] dark:bg-[#111111]">
            <Button onClick={handleSend}>
              <SendIcon className="mr-2 h-4 w-4" /> Enviar
            </Button>
          </div>
        </div>
      </div>
      <div className="w-full max-w-xs bg-background items-start justify-start flex flex-col gap-y-2 shrink-0">
        <FileUploadArea
          onFilesAdded={handleFilesAdded}
          onFileRemoved={handleFileRemoved}
          attachments={attachments}
        />
      </div>
    </div>
  );
};

export default MailingPage;
