"use client";

import React, { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const EmailRenderer = ({ emailData }) => {
  const [showHtml, setShowHtml] = useState(true);
  const [sanitizedHtml, setSanitizedHtml] = useState("");
  const [iframeHeight, setIframeHeight] = useState("0px");
  const iframeRef = useRef(null);

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

  console.log(sanitizedHtml);

  useEffect(() => {
    if (iframeRef.current) {
      const iframeDocument = iframeRef.current.contentDocument;
      iframeDocument.open();
      iframeDocument.write(sanitizedHtml);
      iframeDocument.close();

      const resizeIframe = () => {
        const height = iframeDocument.documentElement.scrollHeight;
        setIframeHeight(`${height}px`);
      };

      // Resize on load
      if (iframeDocument.readyState === "complete") {
        resizeIframe();
      } else {
        iframeDocument.addEventListener("load", resizeIframe);
      }

      // Resize on window resize
      window.addEventListener("resize", resizeIframe);

      // MutationObserver to watch for dynamic content changes
      const observer = new MutationObserver(resizeIframe);
      observer.observe(iframeDocument.body, { childList: true, subtree: true });

      // Fallback: check size periodically for a short time after initial load
      let checkCount = 0;
      const intervalId = setInterval(() => {
        resizeIframe();
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


  const renderTextBody = () => {
    return emailData.textBody.split("\n").map((line, index) => (
      <p key={index} className="mb-2">
        {line}
      </p>
    ));
  };

  const renderAttachments = () => {
    return emailData.attachments.map((attachment, index) => (
      <div key={index} className="">
        <a
          href={`/api/attachment/${attachment.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          {attachment.filename}
        </a>
      </div>
    ));
  };

  return (
    <div className="w-full flex-1">
      <div className="w-full bg-muted/60 border-b p-5 md:px-7">
        <h2 className="text-2xl font-bold">{emailData.subject}</h2>
        <p className="text-sm text-muted-foreground">{emailData.from}</p>
        <p className="text-sm text-muted-foreground">
          {format(new Date(emailData.date), "PPpp", { locale: es })}
        </p>
      </div>

      <div className="w-full flex-1 mx-auto max-w-xl lg:max-w-2xl">
        {showHtml && emailData.htmlBody ? (
          <iframe
            ref={iframeRef}
            title="Email Content"
            className="w-full border-none h-fit"
            style={{
              height: iframeHeight,
              overflow: "hidden",
            }}
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="text-content p-5">{renderTextBody()}</div>
        )}
      </div>

      {emailData.attachments && emailData.attachments.length > 0 && (
        <div className="email-attachments p-5">
          <h3 className="text-lg font-semibold mb-2">Attachments:</h3>
          {renderAttachments()}
        </div>
      )}
    </div>
  );
};

export default EmailRenderer;
