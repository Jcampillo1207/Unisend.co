"use client";

import React, { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { format, formatDate, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const EmailRenderer = ({ emailData }) => {
  const [showHtml, setShowHtml] = useState(true);
  const [sanitizedHtml, setSanitizedHtml] = useState("");
  const [iframeHeight, setIframeHeight] = useState("0px");
  const [iframeWidth, setIframeWidth] = useState("0px");
  const [backgroundColor, setBackgroundColor] = useState("");
  const [textColor, setTextColor] = useState("");
  const [headerHeight, setHeaderHeight] = useState(0);
  const iframeRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    if (emailData.htmlBody) {
      const clean = DOMPurify.sanitize(emailData.htmlBody, {
        ADD_TAGS: ["style", "link"],
        ADD_ATTR: ["target", "rel"],
        FORBID_TAGS: ["script", "iframe"],
        FORBID_ATTR: ["onerror", "onload", "onclick"],
      });
      setSanitizedHtml(clean);
    }
  }, [emailData.htmlBody]);

  useEffect(() => {
    const measureHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        setHeaderHeight(height);
      }
    };

    measureHeaderHeight();
    window.addEventListener("resize", measureHeaderHeight);

    return () => {
      window.removeEventListener("resize", measureHeaderHeight);
    };
  }, []);

  useEffect(() => {
    if (iframeRef.current) {
      const iframeDocument = iframeRef.current.contentDocument;
      iframeDocument.open();
      iframeDocument.write(sanitizedHtml);
      iframeDocument.close();

      const resizeIframe = () => {
        const height = iframeDocument.documentElement.scrollHeight;
        const width = iframeDocument.documentElement.scrollWidth;
        setIframeHeight(`${height}px`);
        setIframeWidth(`${width}px`);
      };

      const detectColors = () => {
        const bodyElement = iframeDocument.body;
        const computedStyle = window.getComputedStyle(bodyElement);
        const bgColor = computedStyle.backgroundColor;
        const txtColor = computedStyle.color;

        setBackgroundColor(bgColor);
        setTextColor(txtColor);

        if (bgColor === "rgba(0, 0, 0, 0)" || bgColor === "transparent") {
          const brightness = getBrightness(txtColor);
          setBackgroundColor(brightness > 128 ? "#000000" : "#FFFFFF");
        }
      };

      if (iframeDocument.readyState === "complete") {
        resizeIframe();
        detectColors();
      } else {
        iframeDocument.addEventListener("load", () => {
          resizeIframe();
          detectColors();
        });
      }

      window.addEventListener("resize", resizeIframe);

      const observer = new MutationObserver(() => {
        resizeIframe();
        detectColors();
      });
      observer.observe(iframeDocument.body, { childList: true, subtree: true });

      let checkCount = 0;
      const intervalId = setInterval(() => {
        resizeIframe();
        detectColors();
        checkCount++;
        if (checkCount > 10) clearInterval(intervalId);
      }, 100);

      return () => {
        window.removeEventListener("resize", resizeIframe);
        observer.disconnect();
        clearInterval(intervalId);
      };
    }
  }, [sanitizedHtml]);

  const getBrightness = (color) => {
    const rgb = color.match(/\d+/g);
    return rgb
      ? (parseInt(rgb[0]) * 299 +
          parseInt(rgb[1]) * 587 +
          parseInt(rgb[2]) * 114) /
          1000
      : 0;
  };

  console.log(iframeWidth);
  const renderTextBody = () => {
    return emailData.textBody.split("\n").map((line, index) => (
      <p key={index} className="mb-2">
        {line}
      </p>
    ));
  };

  const handleAttachmentDownload = (e, attachment) => {
    e.preventDefault();
    try {
      // Verificar si los datos ya están decodificados
      const decodedData = attachment.data.startsWith("data:")
        ? attachment.data.split(",")[1]
        : attachment.data;

      const byteCharacters = atob(decodedData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: attachment.mimeType });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = attachment.filename;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error al descargar el adjunto:", error);
      alert(
        "Hubo un problema al descargar el adjunto. Por favor, inténtelo de nuevo."
      );
    }
  };

  const renderAttachments = () => {
    return emailData.attachments.map((attachment, index) => (
      <div key={index} className="flex items-center space-x-2 mb-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
            clipRule="evenodd"
          />
        </svg>
        <a
          href="#"
          onClick={(e) => handleAttachmentDownload(e, attachment)}
          className="text-blue-500 hover:underline"
        >
          {attachment.filename}
        </a>
        <span className="text-sm text-gray-500">
          ({formatFileSize(attachment.size)})
        </span>
      </div>
    ));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  console.log(iframeWidth);
  console.log(parseInt(iframeWidth.split("px")[0]));

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

  return (
    <div className="w-full flex-1">
      <div
        ref={headerRef}
        className="w-full bg-muted/60 border-b px-5 md:px-7 py-5"
        id="email-header"
      >
        <h2 className="text-2xl font-bold">{emailData.subject}</h2>
        <p className="text-sm text-muted-foreground">{emailData.from}</p>
        <p className="text-sm text-muted-foreground">
          {formatEmailDate(emailData.date)}
        </p>
      </div>

      <div
        className="w-full flex-1 mx-auto px-5 md:px-7"
        id="email-content"
        style={{
          backgroundColor: backgroundColor,
          color: textColor,
          minHeight: `calc(100dvh - 56px - ${headerHeight}px)`,
        }}
      >
        {showHtml && emailData.htmlBody ? (
          <iframe
            ref={iframeRef}
            title="Email Content"
            className={cn(
              "w-full border-none h-fit overflow-hidden no-scrollbar",
              parseInt(iframeWidth.split("px")[0]) < 600
                ? "w-full mx-auto max-w-xl"
                : "w-" + iframeWidth + " mx-auto"
            )}
            style={{
              height: iframeHeight,
              overflow: "hidden !important",
            }}
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="text-content p-5">{renderTextBody()}</div>
        )}
      </div>

      {emailData.attachments && emailData.attachments.length > 0 && (
        <div className="email-attachments p-5 bg-gray-50">
          <h3 className="text-lg font-semibold mb-2">Adjuntos:</h3>
          {renderAttachments()}
        </div>
      )}
    </div>
  );
};

export default EmailRenderer;
