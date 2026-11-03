import * as React from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  title?: string;
  content: string;
  impact?: string;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}

export function InfoTooltip({
  title,
  content,
  impact,
  className,
  side = "top",
  align = "center",
}: InfoTooltipProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((prev) => !prev);
            }}
            className={cn(
              "inline-flex items-center justify-center size-4 rounded-full text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors cursor-help focus:outline-none focus-visible:ring-1 focus-visible:ring-primary shrink-0 select-none",
              className
            )}
            aria-label={title ? `Information about ${title}` : "Metric information"}
          >
            <Info className="size-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          sideOffset={6}
          style={{ border: "2px solid #eab308", backgroundColor: "#ffffff" }}
          className="max-w-[280px] sm:max-w-xs p-3 text-xs bg-white text-slate-900 border-2 border-yellow-500 shadow-xl rounded-xl z-50 animate-in fade-in-0 zoom-in-95"
        >
          {title && (
            <div className="font-bold text-slate-900 text-[12px] flex items-center gap-1.5 pb-1 border-b border-slate-200 mb-1.5">
              <span className="size-1.5 rounded-full bg-primary" />
              {title}
            </div>
          )}
          <p className="text-slate-600 leading-relaxed text-[11.5px] font-normal">
            {content}
          </p>
          {impact && (
            <div className="mt-2 pt-1.5 border-t border-slate-200 text-[10.5px] text-emerald-600 font-medium flex items-center gap-1">
              <span className="font-bold uppercase tracking-wider text-[9px] text-emerald-700">Business Impact:</span>
              <span>{impact}</span>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
