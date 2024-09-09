"use";

import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { moods } from "./moods";

export const MoodChanger = ({ onMoodChange }) => {
  const [selectedMood, setSelectedMood] = useState(moods[0]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    onMoodChange(mood.value);
    setIsPopoverOpen(false);
  };

  return (
    <div className="absolute right-4 top-2 w-fit items-center justify-end flex gap-x-0.5">
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(selectedMood.color, "hover:bg-opacity-20")}
                >
                  {selectedMood.emoji}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <PopoverContent className="w-fit bg-muted max-h-[32dvh] overflow-scroll" align="end">
              <div className="flex flex-col">
                {moods.map((mood) => (
                  <Button
                    key={mood.value}
                    variant="ghost"
                    className={cn(
                      "flex items-center justify-start w-full text-muted-foreground"
                    )}
                    onClick={() => handleMoodSelect(mood)}
                  >
                    <span className="mr-2">{mood.emoji}</span>
                    <Label className="text-sm cursor-pointer">
                      {mood.name}
                    </Label>
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <TooltipContent
            side="top"
            sideOffset={5}
            align="center"
            className="border bg-muted"
          >
            Ajuste de tono
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
