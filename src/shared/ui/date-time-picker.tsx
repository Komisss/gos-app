import { CalendarIcon } from 'lucide-react';

import { toApiDateTime, parseApiDateTime, toDateInputValue, toTimeInputValue } from '@/shared/lib/dateTime';
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
};

export function DateTimePicker({ value, onChange, placeholder = 'Выберите дату', className }: Props) {
  const selectedDate = parseApiDateTime(value);

  function commitDateTime(date?: Date, time = toTimeInputValue(selectedDate)) {
    if (!date) {
      onChange('');
      return;
    }

    const [hours = '0', minutes = '0'] = time.split(':');
    const nextDate = new Date(date);
    nextDate.setHours(Number(hours), Number(minutes), 0, 0);
    onChange(toApiDateTime(nextDate));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('w-full justify-between border-slate-200 bg-white font-normal', !value && 'text-muted-foreground', className)}
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
          initialFocus
        />
        <div className="border-t border-slate-200 p-3">
          <Input
            type="time"
            value={toTimeInputValue(selectedDate)}
            onChange={(event) => commitDateTime(selectedDate ?? new Date(), event.target.value)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function formatDisplayDate(value: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value);
}
