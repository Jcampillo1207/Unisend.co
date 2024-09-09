"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Mail,
  MailOpen,
  Paperclip,
  Star,
  Calendar,
  Search,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, FormEvent } from "react";
import { Input } from "@/components/ui/input";

export const FiltersAside = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleFilter = (filterKey: string) => {
    console.log("Toggling filter:", filterKey);
    const currentParams = new URLSearchParams(searchParams.toString());
    const currentValue = currentParams.get(filterKey);

    if (currentValue === "true") {
      currentParams.delete(filterKey);
    } else {
      currentParams.set(filterKey, "true");
    }

    // Logging para depuración
    console.log("Updated params:", currentParams.toString());

    const newPath = `?${currentParams.toString()}`;
    console.log("New path:", newPath);

    location.assign(newPath);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const currentParams = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      currentParams.set("q", searchQuery);
    } else {
      currentParams.delete("q");
    }
    const newParams = currentParams.toString();
    const newPath = `?${newParams}`;
    router.push(newPath);
  };

  const clearSearch = () => {
    setSearchQuery("");
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.delete("q");
    const newParams = currentParams.toString();
    const newPath = `?${newParams}`;
    router.push(newPath);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const isUnreadFiltered = searchParams.get("f") === "true";
  const isAttachmentFiltered = searchParams.get("hasAttachment") === "true";
  const isImportantFiltered = searchParams.get("isImportant") === "true";
  const dateFilter = searchParams.get("date");

  return (
    <form
      onSubmit={handleSearch}
      className="w-full h-fit items-center justify-between flex py-2 gap-x-1.5 px-4 border-b sticky top-14 bg-background z-20 overflow-hidden shrink-0"
    >
      <div
        className={cn(
          "flex items-center transition-all duration-300 ease-in-out relative w-full",
          isSearchFocused ? "flex-grow" : "flex-grow-0"
        )}
      >
        <Input
          ref={searchInputRef}
          placeholder="Buscar"
          className="h-8 text-sm transition-all duration-300 ease-in-out w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
        {searchQuery && (
          <Button
            type="button"
            variant="link"
            size="icon"
            className="absolute right-0"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Button
        type="submit"
        variant="default"
        size="icon"
        className={cn(
          "rounded-lg transition-all duration-300 ease-in-out shrink-0",
          isSearchFocused ? "flex" : "hidden"
        )}
      >
        <Search className="size-3.5" />
      </Button>
      <div
        className={cn(
          "flex gap-x-1 transition-all duration-300 ease-in-out",
          isSearchFocused ? "hidden" : "flex"
        )}
      >
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                onClick={() => toggleFilter("f")}
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-lg text-muted-foreground",
                  isUnreadFiltered &&
                    "bg-primary/20 hover:bg-primary/30 text-primary hover:text-primary"
                )}
              >
                {(isUnreadFiltered && <MailOpen className="size-3.5" />) || (
                  <Mail className="size-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="bg-muted border text-foreground"
              side="bottom"
              sideOffset={5}
              align="center"
            >
              {isUnreadFiltered ? "Todos" : "No leídos"}
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                onClick={() => toggleFilter("hasAttachment")}
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-lg text-muted-foreground",
                  isAttachmentFiltered &&
                    "bg-[#FF51D920] hover:bg-[#FF51D920] text-[#FF51D9] hover:text-[#FF51D9]"
                )}
              >
                <Paperclip className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="bg-muted border text-foreground"
              side="bottom"
              sideOffset={5}
              align="center"
            >
              Con archivos adjuntos
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                onClick={() => toggleFilter("isImportant")}
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-lg text-muted-foreground",
                  isImportantFiltered &&
                    "bg-amber-400/20 hover:bg-amber-400/30 text-amber-400 hover:text-amber-400"
                )}
              >
                <Star
                  className={cn(
                    "size-3.5",
                    isImportantFiltered && "fill-amber-400"
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="bg-muted border text-foreground"
              side="bottom"
              sideOffset={5}
              align="center"
            >
              Importantes
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </form>
  );
};
