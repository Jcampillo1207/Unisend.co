import React, { useState, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const emailSchema = z.string().email();

const EmailInput = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const validateAndAddEmail = useCallback(
    (email) => {
      try {
        emailSchema.parse(email);
        if (value.includes(email)) {
          setOpen(true);
          setError("Esta dirección de correo ya ha sido añadida.");
          return;
        }
        onChange([...value, email]);
        setInputValue("");
        setError("");
        setOpen(false);
      } catch (error) {
        setError("Dirección de correo electrónico inválida.");
        setOpen(true);
      }
    },
    [value, onChange]
  );

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setError("");
    setOpen(false);
    if (newValue.endsWith(",")) {
      validateAndAddEmail(newValue.slice(0, -1).trim());
    } else {
      setInputValue(newValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue) {
      e.preventDefault();
      validateAndAddEmail(inputValue.trim());
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
      setError("");
      setOpen(false);
    }
  };

  const removeEmail = (index) => {
    onChange(value.filter((_, i) => i !== index));
    setError("");
    setOpen(false);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-wrap items-center gap-1">
        {value.map((email, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="flex items-center rounded-full group cursor-pointer"
            role="button"
            onClick={() => removeEmail(index)}
          >
            {email}
            <div className="ml-1 text-muted-foreground group-hover:text-muted-foreground">
              <X size={14} />
            </div>
          </Badge>
        ))}
        <TooltipProvider>
          <Tooltip open={open}>
            <TooltipTrigger asChild>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-0 ring-0 rounded-none focus-visible:ring-0 focus-visible:outline-0 px-0 py-3 font-semibold flex-grow text-sm placeholder:text-muted-foreground h-9"
                placeholder={value.length === 0 ? "Añadir destinatario" : ""}
              />
            </TooltipTrigger>
            <TooltipContent side="top" align="start">
              {error}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default EmailInput;
