import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

import { getOrgUnitsTree } from '@/entities/orgUnit/api/orgUnits';
import type { OrgUnit } from '@/entities/orgUnit/model/types';
import { getRegions } from '@/entities/region/api/regions';
import { registerUser } from '@/entities/user/api/users';
import type { RegisterUserPayload, RegisterUserRoleId } from '@/entities/user/model/types';
import { useAuth } from '@/features/auth/model/AuthContext';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { DatePicker } from '@/shared/ui/date-picker';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { UserBulkImportDropzone } from './UserBulkImportDropzone';

const roleOptions: Array<{ id: RegisterUserRoleId; code: string; label: string }> = [
  { id: 1, code: 'federal_manager', label: 'Федеральный управляющий' },
  { id: 2, code: 'regional_manager', label: 'Региональный руководитель' },
  { id: 4, code: 'main_manager', label: 'Б3' },
  { id: 5, code: 'assistant', label: 'Помощник Б3' },
  { id: 6, code: 'unit_head', label: 'Б2' },
  { id: 7, code: 'department_head', label: 'Б1' },
  { id: 8, code: 'employee', label: 'Активист' },
];

const initialForm: RegisterUserPayload = {
  username: '',
  password: '',
  full_name: '',
  phone: '',
  birthday: '',
  max_user_id: '',
  role: 2,
  region: null,
  org_unit: 0,
};

export function NewUserForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const isFederalManager = session?.role?.code === 'federal_manager';
  const [form, setForm] = useState<RegisterUserPayload>(initialForm);
  const credentialsDisabled = !shouldUseCredentials(form.role);
  const maxBirthdayDate = useMemo(() => getAdultMaxBirthdayDate(), []);
  const availableRoleOptions = useMemo(
    () => (isFederalManager ? roleOptions : roleOptions.filter((role) => role.code !== 'federal_manager')),
    [isFederalManager],
  );

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

  const availableOrgUnits = useMemo(
    () => getAvailableOrgUnits(orgUnitsQuery.data ?? [], form.role, form.region),
    [form.region, form.role, orgUnitsQuery.data],
  );

  useEffect(() => {
    if (form.org_unit && !availableOrgUnits.some((orgUnit) => orgUnit.id === form.org_unit)) {
      setForm((current) => ({ ...current, org_unit: 0 }));
    }
  }, [availableOrgUnits, form.org_unit]);

  useEffect(() => {
    if (!isFederalManager && form.role === 1) {
      setForm((current) => ({ ...current, role: 2, region: current.region, org_unit: 0 }));
    }
  }, [form.role, isFederalManager]);

  useEffect(() => {
    if (credentialsDisabled && (form.username || form.password)) {
      setForm((current) => ({ ...current, username: '', password: '' }));
    }
  }, [credentialsDisabled, form.password, form.username]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: RegisterUserPayload = {
      ...form,
      phone: form.phone.trim(),
      birthday: form.birthday,
      region: form.role === 1 ? null : form.region,
      org_unit: canSelectOrgUnit(form.role) ? form.org_unit || null : null,
    };

    if (!shouldUseCredentials(form.role)) {
      delete payload.username;
      delete payload.password;
    }

    createMutation.mutate(payload);
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-6 py-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold !text-slate-900">Новый пользователь</h1>
          <p className="text-sm text-slate-500">
            Заполните данные учетной записи и привязку к региону или структуре подчинения.
          </p>
        </div>

        <UserBulkImportDropzone />

        <form
          className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Роль">
              <Select
                value={String(form.role)}
                onValueChange={(role) => {
                  const nextRole = Number(role) as RegisterUserRoleId;

                  setForm((current) => ({
                    ...current,
                    role: nextRole,
                    region: nextRole === 1 ? null : current.region,
                    org_unit: 0,
                  }));
                }}
              >
                <SelectTrigger className="w-full border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  {availableRoleOptions.map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {form.role !== 1 && (
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
                  onChange={(region) =>
                    setForm((current) => ({ ...current, region, org_unit: 0 }))
                  }
                />
              </Field>
            )}
          </div>

          {canSelectOrgUnit(form.role) && (
            <Field label="Структура подчинения">
              <SearchSelect
                placeholder={getOrgUnitPlaceholder(form.role, form.region)}
                searchPlaceholder="Поиск структуры подчинения"
                loading={orgUnitsQuery.isLoading}
                disabled={!form.region}
                value={form.org_unit}
                options={availableOrgUnits.map((orgUnit) => ({
                  id: orgUnit.id,
                  label: `${'  '.repeat(orgUnit.depth)}${orgUnit.name}`,
                  description: getOrgUnitDescription(orgUnit),
                }))}
                onChange={(org_unit) => setForm((current) => ({ ...current, org_unit }))}
              />
            </Field>
          )}

          <Field label="ФИО">
            <Input
              className="border-slate-200"
              placeholder="Введите ФИО"
              value={form.full_name}
              onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
              required
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Телефон">
              <Input
                className="border-slate-200"
                inputMode="tel"
                placeholder="+7 (999) 999-99-99"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: formatRussianPhone(event.target.value) }))
                }
              />
            </Field>

            <Field label="День рождения">
              <DatePicker
                value={parseDateOnly(form.birthday)}
                maxDate={maxBirthdayDate}
                placeholder="Выберите день рождения"
                onChange={(birthday) =>
                  setForm((current) => ({ ...current, birthday: toDateOnly(birthday) }))
                }
              />
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Логин">
              <Input
                className="border-slate-200"
                placeholder="Введите логин"
                value={form.username ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                disabled={credentialsDisabled}
                required={!credentialsDisabled}
              />
            </Field>

            <Field label="Пароль">
              <Input
                type="password"
                className="border-slate-200"
                placeholder="Введите пароль"
                value={form.password ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                disabled={credentialsDisabled}
                required={!credentialsDisabled}
              />
            </Field>
          </div>

          <Field label="ID пользователя в MAX">
            <Input
              className="border-slate-200"
              placeholder="Введите ID пользователя в MAX"
              value={form.max_user_id}
              onChange={(event) => setForm((current) => ({ ...current, max_user_id: event.target.value }))}
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
  disabled = false,
  value,
  options,
  onChange,
}: {
  placeholder: string;
  searchPlaceholder: string;
  loading: boolean;
  disabled?: boolean;
  value: number | null;
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
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
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
  return [
    orgUnit.regionName,
    orgUnit.headUser ? `Руководитель: ${orgUnit.headUser.full_name}` : null,
    orgUnit.headUser?.role?.name,
  ]
    .filter(Boolean)
    .join(' • ');
}

function getAvailableOrgUnits(orgUnits: OrgUnit[], role: RegisterUserRoleId, regionId: number | null) {
  if (!regionId) {
    return [];
  }

  const targetHeadRoleCodes = getOrgUnitHeadRoleCodesForRole(role);

  return orgUnits.filter((orgUnit) => {
    if (orgUnit.regionId !== regionId || orgUnit.isActive === false) {
      return false;
    }

    if (targetHeadRoleCodes.length === 0) {
      return true;
    }

    return targetHeadRoleCodes.includes(orgUnit.headUser?.role?.code ?? '');
  });
}

function getOrgUnitHeadRoleCodesForRole(role: RegisterUserRoleId) {
  if (role === 4) {
    return ['federal_manager', 'regional_manager'];
  }

  if (role === 5 || role === 6) {
    return ['main_manager'];
  }

  if (role === 7) {
    return ['unit_head'];
  }

  if (role === 8) {
    return ['department_head'];
  }

  return [];
}

function canSelectOrgUnit(role: RegisterUserRoleId) {
  return role !== 1 && role !== 2;
}

function getOrgUnitPlaceholder(role: RegisterUserRoleId, regionId: number | null) {
  if (!regionId) {
    return 'Сначала выберите регион';
  }

  if (getOrgUnitHeadRoleCodesForRole(role).length > 0) {
    return 'Выберите доступную подгруппу';
  }

  return 'Выберите структуру подчинения';
}

function shouldUseCredentials(role: RegisterUserRoleId) {
  return role === 1 || role === 2;
}

function getAdultMaxBirthdayDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  date.setHours(0, 0, 0, 0);

  return date;
}

function formatRussianPhone(value: string) {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  const nationalDigits = normalizeRussianPhoneDigits(digits).slice(0, 10);
  const parts = [
    nationalDigits.slice(0, 3),
    nationalDigits.slice(3, 6),
    nationalDigits.slice(6, 8),
    nationalDigits.slice(8, 10),
  ];

  let result = '+7';

  if (parts[0]) {
    result += ` (${parts[0]}`;
  }

  if (parts[0].length === 3) {
    result += ')';
  }

  if (parts[1]) {
    result += ` ${parts[1]}`;
  }

  if (parts[2]) {
    result += `-${parts[2]}`;
  }

  if (parts[3]) {
    result += `-${parts[3]}`;
  }

  return result;
}

function normalizeRussianPhoneDigits(digits: string) {
  if (digits.startsWith('7') || digits.startsWith('8')) {
    return digits.slice(1);
  }

  return digits;
}

function parseDateOnly(value: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toDateOnly(date?: Date) {
  if (!date) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 !mb-1">{label}</p>
      {children}
    </div>
  );
}
