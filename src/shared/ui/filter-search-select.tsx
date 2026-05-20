import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { ScrollArea } from '@/shared/ui/scroll-area';

export type FilterSearchSelectOption = {
  value: string;
  label: string;
  description?: string;
};

export function FilterSearchSelect({
  label,
  value,
  placeholder,
  searchPlaceholder = 'Поиск',
  options,
  disabled = false,
  onChange,
}: {
  label: string;
  value?: string;
  placeholder: string;
  searchPlaceholder?: string;
  options: FilterSearchSelectOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      `${option.label} ${option.description ?? ''}`.toLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      <Popover open={open && !disabled} onOpenChange={(nextOpen) => setOpen(disabled ? false : nextOpen)}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-9 w-full justify-between border-slate-200 bg-white text-left text-sm font-normal"
          >
            <span className="min-w-0 truncate">{selectedOption?.label.trim() ?? placeholder}</span>
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(420px,calc(100vw-3rem))] p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-9 border-slate-200 pl-9 text-sm"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <ScrollArea className="mt-3 h-64 rounded-md border border-slate-200">
            <div className="p-1">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
                onClick={() => handleSelect('')}
              >
                <Check
                  className={cn('size-4 text-[#465cd3]', !value ? 'opacity-100' : 'opacity-0')}
                />
                <span className="font-medium text-slate-900">{placeholder}</span>
              </button>

              {filteredOptions.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-slate-500">
                  Ничего не найдено.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
                    onClick={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        'mt-0.5 size-4 text-[#465cd3]',
                        value === option.value ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block font-medium text-slate-900">{option.label}</span>
                      {option.description && (
                        <span className="block text-xs text-slate-500">{option.description}</span>
                      )}
                    </span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
