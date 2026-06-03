import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Calendar } from "@/shared/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover"

type Props = {
  value?: Date
  onChange?: (date?: Date) => void
  placeholder?: string
  disabled?: boolean
  maxDate?: Date
}

export function DatePicker({ value, onChange, placeholder, disabled = false, maxDate }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          variant="outline"
          className={cn(
            "w-full justify-between border-stroke",
            !value && "text-muted-foreground"
          )}
        >
          {value ? format(value, "dd.MM.yyyy") : placeholder || "Выберите дату"}
          <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={maxDate ? { after: maxDate } : undefined}
          endMonth={maxDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
