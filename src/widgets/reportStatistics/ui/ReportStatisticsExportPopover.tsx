import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Download, Search } from 'lucide-react';

import type { ExportCreateResponse } from '@/entities/export/model/types';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

export type ExportSelectOption = {
  value: string;
  label: string;
  description?: string;
};

type ExportField<TFilters> =
  | {
      kind: 'date';
      key: keyof TFilters & string;
      label: string;
    }
  | {
      kind: 'select';
      key: keyof TFilters & string;
      label: string;
      options: ExportSelectOption[];
    }
  | {
      kind: 'multi-search';
      key: keyof TFilters & string;
      label: string;
      placeholder: string;
      searchPlaceholder: string;
      options: ExportSelectOption[];
      valueType?: 'number' | 'string';
    }
  | {
      kind: 'multi';
      key: keyof TFilters & string;
      label: string;
      placeholder: string;
      options: ExportSelectOption[];
      valueType?: 'number' | 'string';
    }
  | {
      kind: 'boolean';
      key: keyof TFilters & string;
      label: string;
    }
  | {
      kind: 'number';
      key: keyof TFilters & string;
      label: string;
      min?: number;
    }
  | {
      kind: 'text-list';
      key: keyof TFilters & string;
      label: string;
      placeholder: string;
    };

type Props<TFilters> = {
  title: string;
  tableFilters: unknown;
  fields: Array<ExportField<TFilters>>;
  createEmptyFilters: () => TFilters;
  toExportFilters: (tableFilters: unknown) => TFilters;
  createExport: (filters: TFilters) => Promise<ExportCreateResponse>;
  onExportStarted: (job: ExportCreateResponse) => void;
};

export function ReportStatisticsExportPopover<TFilters extends object>({
  title,
  tableFilters,
  fields,
  createEmptyFilters,
  toExportFilters,
  createExport,
  onExportStarted,
}: Props<TFilters>) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<TFilters>(() => createEmptyFilters());

  const exportMutation = useMutation({
    mutationFn: () => createExport(filters),
    onSuccess: (job) => {
      onExportStarted(job);
      setOpen(false);
    },
  });

  function updateFilter(key: keyof TFilters & string, value: unknown) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  const mainFields = fields.filter((field) => field.kind !== 'boolean');
  const booleanFields = fields.filter((field) => field.kind === 'boolean');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-fit border-slate-200 bg-white">
          <Download />
          Экспорт XLSX
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(920px,calc(100vw-3rem))] p-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-xs text-slate-500">
              Фильтры экспорта открываются пустыми. Можно заполнить их вручную или перенести
              текущие фильтры таблицы.
            </p>
          </div>

          <div className="grid max-h-[62vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-4">
            {mainFields.map((field) => (
              <ExportFieldControl
                key={field.key}
                field={field}
                value={(filters as Record<string, unknown>)[field.key]}
                onChange={(value) => updateFilter(field.key, value)}
              />
            ))}
          </div>

          {booleanFields.length > 0 && (
            <div className="grid gap-3 border-t border-slate-200 pt-4 md:grid-cols-3">
              {booleanFields.map((field) => (
                <ExportFieldControl
                  key={field.key}
                  field={field}
                  value={(filters as Record<string, unknown>)[field.key]}
                  onChange={(value) => updateFilter(field.key, value)}
                />
              ))}
            </div>
          )}

          {exportMutation.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              Не удалось запустить экспорт.
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="outline" onClick={() => setFilters(createEmptyFilters())}>
              Сбросить
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setFilters(toExportFilters(tableFilters))}>
                Перенести фильтры таблицы
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button
                type="button"
                className="bg-[#465cd3] text-white hover:bg-[#3c50bd]"
                disabled={exportMutation.isPending}
                onClick={() => exportMutation.mutate()}
              >
                {exportMutation.isPending ? 'Запускаем...' : 'Экспортировать'}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ExportFieldControl<TFilters>({
  field,
  value,
  onChange,
}: {
  field: ExportField<TFilters>;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.kind === 'date') {
    return <DateFilter label={field.label} value={String(value ?? '')} onChange={onChange} />;
  }

  if (field.kind === 'select') {
    return <FilterSelect label={field.label} value={String(value ?? '')} options={field.options} onChange={onChange} />;
  }

  if (field.kind === 'multi-search') {
    return (
      <MultiSearchSelect
        label={field.label}
        values={toStringValues(value)}
        placeholder={field.placeholder}
        searchPlaceholder={field.searchPlaceholder}
        options={field.options}
        onChange={(values) => onChange(field.valueType === 'number' ? toNumbers(values) : values)}
      />
    );
  }

  if (field.kind === 'multi') {
    return (
      <MultiSelect
        label={field.label}
        values={toStringValues(value)}
        placeholder={field.placeholder}
        options={field.options}
        onChange={(values) => onChange(field.valueType === 'number' ? toNumbers(values) : values)}
      />
    );
  }

  if (field.kind === 'number') {
    return (
      <NumberFilter
        label={field.label}
        value={typeof value === 'number' ? value : field.min ?? 0}
        min={field.min ?? 0}
        onChange={onChange}
      />
    );
  }

  if (field.kind === 'text-list') {
    return (
      <TextListFilter
        label={field.label}
        values={toStringValues(value)}
        placeholder={field.placeholder}
        onChange={onChange}
      />
    );
  }

  return <BooleanFilter label={field.label} checked={value === true} onChange={onChange} />;
}

function MultiSearchSelect({
  label,
  values,
  placeholder,
  searchPlaceholder,
  options,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder: string;
  searchPlaceholder: string;
  options: ExportSelectOption[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedOptions = options.filter((option) => values.includes(option.value));
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      `${option.label} ${option.description ?? ''}`.toLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

  function toggleValue(value: string) {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="h-9 w-full justify-between border-slate-200 bg-white text-left text-sm font-normal">
            <span className="min-w-0 truncate">{selectedOptions.length ? `Выбрано: ${selectedOptions.length}` : placeholder}</span>
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(520px,calc(100vw-3rem))] p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input className="h-9 border-slate-200 pl-9 text-sm" placeholder={searchPlaceholder} value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="mt-3 flex justify-between gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => onChange(options.map((option) => option.value))}>
              Выбрать все
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange([])}>
              Очистить
            </Button>
          </div>
          <ScrollArea className="mt-3 h-64 rounded-md border border-slate-200">
            <div className="p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-slate-500">Ничего не найдено.</div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
                    onClick={() => toggleValue(option.value)}
                  >
                    <Check className={cn('mt-0.5 size-4 text-[#465cd3]', values.includes(option.value) ? 'opacity-100' : 'opacity-0')} />
                    <span className="min-w-0">
                      <span className="block font-medium text-slate-900">{option.label}</span>
                      {option.description && <span className="block text-xs text-slate-500">{option.description}</span>}
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

function MultiSelect({
  label,
  values,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder: string;
  options: ExportSelectOption[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="h-9 w-full justify-between border-slate-200 bg-white text-left text-sm font-normal">
            <span className="min-w-0 truncate">{values.length ? `Выбрано: ${values.length}` : placeholder}</span>
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(360px,calc(100vw-3rem))] p-2">
          <div className="space-y-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
                onClick={() => onChange(values.includes(option.value) ? values.filter((value) => value !== option.value) : [...values, option.value])}
              >
                <Check className={cn('size-4 text-[#465cd3]', values.includes(option.value) ? 'opacity-100' : 'opacity-0')} />
                <span className="font-medium text-slate-900">{option.label}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function DateFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      <DateTimePicker value={value} onChange={onChange} placeholder="Выберите дату" />
    </div>
  );
}

function TextListFilter({
  label,
  values,
  placeholder,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder: string;
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      <Input
        className="h-9 border-slate-200 bg-white text-sm"
        placeholder={placeholder}
        value={values.join(', ')}
        onChange={(event) => onChange(toStringList(event.target.value))}
      />
    </div>
  );
}

function NumberFilter({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      <Input
        className="h-9 border-slate-200 bg-white text-sm"
        min={min}
        type="number"
        value={value}
        onChange={(event) => onChange(Math.max(min, Number(event.target.value) || min))}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ExportSelectOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-full border-slate-200 bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function BooleanFilter({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700">
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      {label}
    </label>
  );
}

function toStringValues(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function toNumbers(values: string[]) {
  return values.map(Number).filter((value) => Number.isFinite(value));
}

function toStringList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
