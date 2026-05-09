import { CalendarIcon } from 'lucide-react';

import { toApiDateTime, parseApiDateTime, toTimeInputValue } from '@/shared/lib/dateTime';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

type Props = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minDateTime?: Date;
};

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Выберите дату',
  className,
  minDateTime,
}: Props) {
  const selectedDate = parseApiDateTime(value);
  const minDate = minDateTime ? startOfDay(minDateTime) : undefined;
  const isMinSelectedDay =
    Boolean(minDateTime && selectedDate) &&
    selectedDate?.toDateString() === minDateTime?.toDateString();

  function commitDateTime(date?: Date, time = toTimeInputValue(selectedDate)) {
    if (!date) {
      onChange('');
      return;
    }

    const [hours = '0', minutes = '0'] = time.split(':');
    const nextDate = new Date(date);
    nextDate.setHours(Number(hours), Number(minutes), 0, 0);
    onChange(toApiDateTime(minDateTime && nextDate < minDateTime ? minDateTime : nextDate));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-between border-slate-200 bg-white font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
          <CalendarIcon className="ml-2 size-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => commitDateTime(date)}
          disabled={minDate ? { before: minDate } : undefined}
          initialFocus
        />
        <div className="border-t border-slate-200 p-3">
          <Input
            type="time"
            value={toTimeInputValue(selectedDate)}
            min={isMinSelectedDay ? toTimeInputValue(minDateTime) : undefined}
            onChange={(event) => commitDateTime(selectedDate ?? new Date(), event.target.value)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDisplayDate(value: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value);
}
