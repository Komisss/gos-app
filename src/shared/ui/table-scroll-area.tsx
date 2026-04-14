import * as React from "react";

import { cn } from "@/shared/lib/utils";
import { ScrollArea, ScrollBar } from "@/shared/ui/scroll-area";

type TableScrollAreaProps = React.ComponentProps<"div"> & {
  scrollClassName?: string;
  headerHeight?: string;
  height?: string;
};

export function TableScrollArea({
  className,
  scrollClassName,
  headerHeight = "2.5rem",
  height = "70vh",
  children,
  style,
  ...props
}: TableScrollAreaProps) {
  return (
    <div
      className={cn(
        "min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white",
        "[&_[data-slot=scroll-area-scrollbar][data-orientation=vertical]]:!top-[var(--table-header-height)]",
        "[&_[data-slot=scroll-area-scrollbar][data-orientation=vertical]]:!h-[calc(100%-var(--table-header-height))]",
        className
      )}
      style={
        {
          "--table-header-height": headerHeight,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <ScrollArea className={cn("min-w-0 max-w-full w-full", scrollClassName)} style={{ height }}>
        {children}
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
