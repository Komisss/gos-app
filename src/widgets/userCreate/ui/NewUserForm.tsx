import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Download, Search } from 'lucide-react';

import { getOrgUnitsTree } from '@/entities/orgUnit/api/orgUnits';
import {
  filterOrgUnitsForUserRole,
  getAutoLockedOrgUnitForUserRole,
  getOrgUnitHeadRoleIdsForUserRole,
} from '@/entities/orgUnit/lib/filterOrgUnitsForUserRole';
import type { OrgUnit } from '@/entities/orgUnit/model/types';
import { getRegions } from '@/entities/region/api/regions';
import { getRoles, getUserById, registerUser } from '@/entities/user/api/users';
import type { RegisterUserPayload, RegisterUserRoleId } from '@/entities/user/model/types';
import { USER_ROLE_IDS, mapRolesToOptions } from '@/entities/user/model/roleOptions';
import { useAuth } from '@/features/auth/model/AuthContext';
import { formatRussianPhone, isCompleteRussianPhone } from '@/shared/lib/russianPhone';
import { getUsernameError } from '@/shared/lib/username';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { DatePicker } from '@/shared/ui/date-picker';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { USER_IMPORT_TEMPLATE_URL } from '../model/userImportTemplate';
import { UserBulkImportDropzone } from './UserBulkImportDropzone';

const initialForm: RegisterUserPayload = {
  username: '',
  password: '',
  full_name: '',
  phone: '',
  birthday: '',
  link_vk: '',
  max_user_id: null,
  role: USER_ROLE_IDS.regionalManager,
  region: null,
  org_unit: 0,
};

export function NewUserForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const isFederalManager = session?.role?.id === USER_ROLE_IDS.federalManager;
  const isRegionalManager = session?.role?.id === USER_ROLE_IDS.regionalManager;
  const [form, setForm] = useState<RegisterUserPayload>(initialForm);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [regionError, setRegionError] = useState<string | null>(null);
  const [birthdayError, setBirthdayError] = useState<string | null>(null);
  const showCredentials = shouldUseCredentials(form.role);
  const maxBirthdayDate = useMemo(() => getAdultMaxBirthdayDate(), []);
  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
  });
  const roleOptions = useMemo(() => mapRolesToOptions(rolesQuery.data ?? []), [rolesQuery.data]);
  const availableRoleOptions = useMemo(() => {
    if (isFederalManager) {
      return roleOptions;
    }

    if (isRegionalManager) {
      return roleOptions.filter((role) => role.id >= USER_ROLE_IDS.mainManager);
    }

    return roleOptions.filter((role) => role.id !== USER_ROLE_IDS.federalManager);
  }, [isFederalManager, isRegionalManager, roleOptions]);
  const selectedRoleOption = availableRoleOptions.find((role) => role.id === form.role);

  const regionsQuery = useQuery({
    queryKey: ['regions'],
    queryFn: getRegions,
  });

  const orgUnitsQuery = useQuery({
    queryKey: ['org-units-tree'],
    queryFn: getOrgUnitsTree,
  });

  const currentUserQuery = useQuery({
    queryKey: ['users', session?.userId],
    queryFn: () => getUserById(session?.userId ?? 0),
    enabled: isRegionalManager && Boolean(session?.userId),
  });

  const createMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
  });

  const availableOrgUnits = useMemo(
    () => filterOrgUnitsForUserRole(orgUnitsQuery.data ?? [], form.role, form.region),
    [form.region, form.role, orgUnitsQuery.data],
  );
  const autoLockedOrgUnit = useMemo(
    () => getAutoLockedOrgUnitForUserRole(availableOrgUnits, form.role, form.region),
    [availableOrgUnits, form.region, form.role],
  );

  useEffect(() => {
    if (!autoLockedOrgUnit || form.org_unit === autoLockedOrgUnit.id) {
      return;
    }

    setForm((current) => ({ ...current, org_unit: autoLockedOrgUnit.id }));
  }, [autoLockedOrgUnit, form.org_unit]);

  useEffect(() => {
    if (form.org_unit && !availableOrgUnits.some((orgUnit) => orgUnit.id === form.org_unit)) {
      setForm((current) => ({ ...current, org_unit: 0 }));
    }
  }, [availableOrgUnits, form.org_unit]);

  useEffect(() => {
    if (availableRoleOptions.length === 0) {
      return;
    }

    if (!availableRoleOptions.some((role) => role.id === form.role)) {
      setForm((current) => ({
        ...current,
        role: availableRoleOptions[0]?.id ?? current.role,
        region: current.region,
        org_unit: 0,
      }));
    }
  }, [availableRoleOptions, form.role]);

  useEffect(() => {
    if (!showCredentials && (form.username || form.password)) {
      setForm((current) => ({ ...current, username: '', password: '' }));
    }

    if (!showCredentials) {
      setUsernameError(null);
    }
  }, [form.password, form.username, showCredentials]);

  useEffect(() => {
    const managerRegionId = currentUserQuery.data?.region?.id;

    if (!isRegionalManager || !managerRegionId) {
      return;
    }

    setForm((current) =>
      current.region === managerRegionId
        ? current
        : { ...current, region: managerRegionId, org_unit: 0 },
    );
    setRegionError(null);
  }, [currentUserQuery.data?.region?.id, isRegionalManager]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextPhoneError = getPhoneError(form.phone);
    const trimmedUsername = form.username?.trim() ?? '';
    const nextUsernameError = showCredentials ? getUsernameError(trimmedUsername) : null;
    const nextRegionError =
      form.role !== USER_ROLE_IDS.federalManager && !form.region ? 'Выберите регион.' : null;
    const nextBirthdayError = form.birthday ? null : 'Выберите день рождения.';

    setPhoneError(nextPhoneError);
    setUsernameError(nextUsernameError);
    setRegionError(nextRegionError);
    setBirthdayError(nextBirthdayError);

    if (
      nextPhoneError ||
      nextUsernameError ||
      nextRegionError ||
      nextBirthdayError
    ) {
      return;
    }

    const payload: RegisterUserPayload = {
      ...form,
      username: trimmedUsername,
      password: form.password?.trim() ?? '',
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      birthday: form.birthday,
      link_vk: form.link_vk?.trim() ?? '',
      max_user_id: null,
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

        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Массовое добавление пользователей</h2>
              <p className="mt-1 text-xs text-slate-500">
                Скачайте шаблон для заполнения или загрузите готовый XLSX-файл.
              </p>
            </div>
            <Button asChild type="button" variant="outline" className="shrink-0 border-slate-200 bg-white">
              <a href={USER_IMPORT_TEMPLATE_URL} download>
                <Download />
                Скачать шаблон
              </a>
            </Button>
          </div>
          <UserBulkImportDropzone />
        </div>

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
                    region: nextRole === USER_ROLE_IDS.federalManager ? null : current.region,
                    org_unit: 0,
                  }));
                }}
              >
                <SelectTrigger className="w-full border-slate-200 bg-white text-slate-900 [&_[data-slot=select-value]]:text-slate-900">
                  <SelectValue placeholder={selectedRoleOption?.label ?? 'Выберите роль'} />
                </SelectTrigger>
                <SelectContent align="start" position="popper" className="z-[100] bg-white text-slate-900">
                  {availableRoleOptions.map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {form.role !== USER_ROLE_IDS.federalManager && (
              <Field label="Регион">
                <SearchSelect
                  placeholder="Выберите регион"
                  searchPlaceholder="Поиск региона"
                  loading={regionsQuery.isLoading}
                  disabled={isRegionalManager}
                  value={form.region}
                  options={(regionsQuery.data ?? []).map((region) => ({
                    id: region.id,
                    label: region.name,
                    description: region.code,
                  }))}
                  onChange={(region) => {
                    setForm((current) => ({ ...current, region, org_unit: 0 }));
                    setRegionError(null);
                  }}
                />
                {regionError && <p className="text-sm text-red-600">{regionError}</p>}
              </Field>
            )}
          </div>

          {canSelectOrgUnit(form.role) && (
            <Field label="Структура подчинения">
              <SearchSelect
                placeholder={getOrgUnitPlaceholder(form.role, form.region)}
                searchPlaceholder="Поиск структуры подчинения"
                loading={orgUnitsQuery.isLoading}
                disabled={!form.region || Boolean(autoLockedOrgUnit)}
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
                className={phoneError ? 'border-red-400 focus-visible:ring-red-200' : 'border-slate-200'}
                inputMode="tel"
                placeholder="89999999999"
                value={form.phone}
                aria-invalid={Boolean(phoneError)}
                aria-required="true"
                onChange={(event) => {
                  const phone = formatRussianPhone(event.target.value);
                  setForm((current) => ({ ...current, phone }));

                  if (isCompleteRussianPhone(phone)) {
                    setPhoneError(null);
                  }
                }}
              />
              {phoneError && <p className="text-sm text-red-600">{phoneError}</p>}
            </Field>

            <Field label="День рождения">
              <DatePicker
                value={parseDateOnly(form.birthday)}
                maxDate={maxBirthdayDate}
                placeholder="Выберите день рождения"
                onChange={(birthday) => {
                  setForm((current) => ({ ...current, birthday: toDateOnly(birthday) }));
                  setBirthdayError(null);
                }}
              />
              {birthdayError && <p className="text-sm text-red-600">{birthdayError}</p>}
            </Field>
          </div>

          <Field label="Ссылка ВК">
            <Input
              className="border-slate-200"
              placeholder="https://vk.com/..."
              value={form.link_vk ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, link_vk: event.target.value }))}
            />
          </Field>

          {showCredentials && (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Логин">
                <Input
                  className={usernameError ? 'border-red-400 focus-visible:ring-red-200' : 'border-slate-200'}
                  placeholder="Введите логин"
                  value={form.username ?? ''}
                  aria-invalid={Boolean(usernameError)}
                  onChange={(event) => {
                    const username = event.target.value;
                    setForm((current) => ({ ...current, username }));
                    setUsernameError(username ? getUsernameError(username) : null);
                  }}
                  required
                />
                {usernameError && <p className="text-sm text-red-600">{usernameError}</p>}
              </Field>

              <Field label="Пароль">
                <Input
                  type="password"
                  className="border-slate-200"
                  placeholder="Введите пароль"
                  value={form.password ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  required
                />
              </Field>
            </div>
          )}

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
          className="min-h-10 w-full justify-between gap-2 border-slate-200 bg-white text-left font-normal"
        >
          <span className="min-w-0">
            <span className={cn('block truncate', selectedOption ? 'text-slate-900' : 'text-slate-500')}>
              {selectedOption?.label.trim() ?? placeholder}
            </span>
            {selectedOption?.description && (
              <span className="block truncate text-xs text-slate-500">{selectedOption.description}</span>
            )}
          </span>
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

function canSelectOrgUnit(role: RegisterUserRoleId) {
  return role !== USER_ROLE_IDS.federalManager && role !== USER_ROLE_IDS.regionalManager;
}

function getOrgUnitPlaceholder(role: RegisterUserRoleId, regionId: number | null) {
  if (!regionId) {
    return 'Сначала выберите регион';
  }

  if (getOrgUnitHeadRoleIdsForUserRole(role).length > 0) {
    return 'Выберите доступную подгруппу';
  }

  return 'Выберите структуру подчинения';
}

function shouldUseCredentials(role: RegisterUserRoleId) {
  return role === USER_ROLE_IDS.federalManager || role === USER_ROLE_IDS.regionalManager;
}

function getAdultMaxBirthdayDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  date.setHours(0, 0, 0, 0);

  return date;
}

function getPhoneError(value: string) {
  if (!value) {
    return 'Номер телефона обязателен.';
  }

  return isCompleteRussianPhone(value) ? null : 'Введите номер телефона полностью: 11 цифр.';
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
