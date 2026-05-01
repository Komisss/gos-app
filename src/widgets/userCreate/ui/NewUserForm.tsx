import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

import { getOrgUnitsTree } from '@/entities/orgUnit/api/orgUnits';
import type { OrgUnit } from '@/entities/orgUnit/model/types';
import { getRegions } from '@/entities/region/api/regions';
import type { Region } from '@/entities/region/model/types';
import { registerUser } from '@/entities/user/api/users';
import type { RegisterUserPayload } from '@/entities/user/model/types';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

const initialForm: RegisterUserPayload = {
  username: '',
  password: '',
  full_name: '',
  role: 2,
  region: 0,
  org_unit: 0,
};

export function NewUserForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RegisterUserPayload>(initialForm);

  const regionsQuery = useQuery({
    queryKey: ['regions'],
    queryFn: getRegions,
  });

  const orgUnitsQuery = useQuery({
    queryKey: ['org-units-tree'],
    queryFn: getOrgUnitsTree,
  });

  const createMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate(form);
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5 px-6 py-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold !text-slate-900">Новый пользователь</h1>
          <p className="text-sm text-slate-500">
            Заполните данные учетной записи и привязку к региону или оргструктуре.
          </p>
        </div>

        <form
          className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Логин">
              <Input
                className="border-slate-200"
                placeholder="Введите логин"
                value={form.username}
                onChange={(event) =>
                  setForm((current) => ({ ...current, username: event.target.value }))
                }
                required
              />
            </Field>

            <Field label="Пароль">
              <Input
                type="password"
                className="border-slate-200"
                placeholder="Введите пароль"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                required
              />
            </Field>
          </div>

          <Field label="ФИО">
            <Input
              className="border-slate-200"
              placeholder="Введите ФИО"
              value={form.full_name}
              onChange={(event) =>
                setForm((current) => ({ ...current, full_name: event.target.value }))
              }
              required
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Роль">
              <Select
                value={String(form.role)}
                onValueChange={(role) =>
                  setForm((current) => ({ ...current, role: Number(role) as 1 | 2 }))
                }
              >
                <SelectTrigger className="w-full border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="1">Федеральный</SelectItem>
                  <SelectItem value="2">Региональный</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Регион">
              <SearchSelect
                placeholder="Выберите регион"
                searchPlaceholder="Поиск региона"
                loading={regionsQuery.isLoading}
                value={form.region}
                options={(regionsQuery.data ?? []).map((region) => ({
                  id: region.id,
                  label: region.name,
                  description: region.code,
                }))}
                onChange={(region) => setForm((current) => ({ ...current, region }))}
              />
            </Field>
          </div>

          <Field label="Оргструктура">
            <SearchSelect
              placeholder="Выберите оргструктуру"
              searchPlaceholder="Поиск оргструктуры"
              loading={orgUnitsQuery.isLoading}
              value={form.org_unit}
              options={(orgUnitsQuery.data ?? []).map((orgUnit) => ({
                id: orgUnit.id,
                label: `${'  '.repeat(orgUnit.depth)}${orgUnit.name}`,
                description: getOrgUnitDescription(orgUnit),
              }))}
              onChange={(org_unit) => setForm((current) => ({ ...current, org_unit }))}
            />
          </Field>

          {createMutation.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Не удалось создать пользователя.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <Button asChild variant="outline" className="border-slate-200">
              <Link to="/users">К списку пользователей</Link>
            </Button>
            <Button
              className="bg-[#465cd3] text-white hover:bg-[#3c50bd]"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Создание...' : 'Создать пользователя'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

type SearchOption = {
  id: number;
  label: string;
  description?: string;
};

function SearchSelect({
  placeholder,
  searchPlaceholder,
  loading,
  value,
  options,
  onChange,
}: {
  placeholder: string;
  searchPlaceholder: string;
  loading: boolean;
  value: number;
  options: SearchOption[];
  onChange: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedOption = options.find((option) => option.id === value);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      `${option.label} ${option.description ?? ''}`.toLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

  function handleSelect(option: SearchOption) {
    onChange(option.id);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full justify-between border-slate-200 bg-white text-left font-normal"
        >
          <span className="min-w-0 truncate">{selectedOption?.label.trim() ?? placeholder}</span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(560px,calc(100vw-3rem))] p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="h-9 border-slate-200 pl-9"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <ScrollArea className="mt-3 h-64 rounded-md border border-slate-200">
          <div className="p-1">
            {loading ? (
              <div className="px-3 py-8 text-center text-sm text-slate-500">
                Загружаем список...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-slate-500">
                Ничего не найдено.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
                  onClick={() => handleSelect(option)}
                >
                  <Check
                    className={cn(
                      'mt-0.5 size-4 text-[#465cd3]',
                      value === option.id ? 'opacity-100' : 'opacity-0',
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
  );
}

function getOrgUnitDescription(orgUnit: OrgUnit) {
  return orgUnit.regionId ? `Регион #${orgUnit.regionId}` : undefined;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 !mb-1">{label}</p>
      {children}
    </div>
  );
}
