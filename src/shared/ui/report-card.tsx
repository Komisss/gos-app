// shared/ui/report-card/report-card.tsx

import { Badge } from "@/shared/ui/badge"
import {cn} from "@shared/lib/utils.ts";

type Props = {
  title: string
  format: "PDF" | "XLSX",
  onClick?: () => void,
}

export function ReportCard({ title, format, onClick }: Props) {
  const isPdf = format === "PDF"

  return (
    <div onClick={onClick} className="flex items-center justify-between rounded-lg border border-stroke p-[8px] cursor-pointer hover:bg-muted transition mb-[8px]">

      <span className="text-text-1 text-[13px]">{title}</span>

      <Badge
        className={cn("text-[13px] w-[40px] rounded-[5px]",
          isPdf
            ? "bg-red-bg text-black"
            : "bg-[#E0E0E0] text-black"
        )

        }
      >
        {format}
      </Badge>

    </div>
  )
}