import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, Power, PowerOff, Save } from 'lucide-react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getOrgUnitsTree } from '@/entities/orgUnit/api/orgUnits';
import {
  filterOrgUnitsForUserRole,
  getAutoLockedOrgUnitForUserRole,
} from '@/entities/orgUnit/lib/filterOrgUnitsForUserRole';
import type { OrgUnit } from '@/entities/orgUnit/model/types';
import {
  activateUser,
  deactivateUser,
  getUserById,
  getUserStatusLabel,
  updateUser,
} from '@/entities/user/api/users';
import type { UserDetails, UserPatchPayload } from '@/entities/user/model/types';
import { isManagementRole } from '@/entities/user/lib/isManagementRole';
import { useAuth } from '@/features/auth/model/AuthContext';
import { formatRussianPhone, isCompleteRussianPhone } from '@/shared/lib/russianPhone';
import { getUsernameError } from '@/shared/lib/username';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { DatePicker } from '@/shared/ui/date-picker';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

type UserFormState = {
  username: string;
  full_name: string;
  max_user_id: string;
  phone: string;
  birthday: string;
  role: number | null;
  org_unit: number | null;
};

const roleOptions: Array<{ id: number; code: string; label: string }> = [
  { id: 2, code: 'regional_manager', label: 'Региональный руководитель' },
  { id: 4, code: 'main_manager', label: 'Б3' },
  { id: 5, code: 'assistant', label: 'Помощник Б3' },
  { id: 6, code: 'unit_head', label: 'Б2' },
  { id: 7, code: 'department_head', label: 'Б1' },
  { id: 8, code: 'employee', label: 'Активист' },
];

export function UserProfileCard() {
  const { userId } = useParams();
  const parsedUserId = Number(userId);
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isOrgUnitTouched, setIsOrgUnitTouched] = useState(false);
  const [toggleActiveConfirmOpen, setToggleActiveConfirmOpen] = useState(false);
  const isCurrentUserRegionalManager = session?.role?.code === 'regional_manager';

  const userQuery = useQuery({
    queryKey: ['users', parsedUserId],
    queryFn: () => getUserById(parsedUserId),
    enabled: Number.isFinite(parsedUserId),
  });

  const orgUnitsQuery = useQuery({
    queryKey: ['org-units-tree'],
    queryFn: getOrgUnitsTree,
  });

  const effectiveFormRoleId = getEffectiveRoleId(form.role, userQuery.data?.role);

  useEffect(() => {
    if (userQuery.data) {
      setForm(getInitialForm(userQuery.data));
      setPhoneError(null);
      setUsernameError(null);
      setIsOrgUnitTouched(false);
    }
  }, [userQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (payload: UserPatchPayload) => updateUser(parsedUserId, payload),
    onSuccess: async (updatedUser) => {
      setForm(getInitialForm(updatedUser));
      setIsOrgUnitTouched(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        queryClient.invalidateQueries({ queryKey: ['users', parsedUserId] }),
      ]);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (user: UserDetails) => {
      if (isFederalManager(user)) {
        throw new Error('Нельзя изменять федерального управляющего.');
      }

      return user.active ? deactivateUser(user.id) : activateUser(user.id);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        queryClient.invalidateQueries({ queryKey: ['users', parsedUserId] }),
      ]);
    },
  });

  const availableRoleOptions = useMemo(() => {
    if (isCurrentUserRegionalManager) {
      return roleOptions.filter((role) => role.id >= 4);
    }

    return roleOptions;
  }, [isCurrentUserRegionalManager]);

  const availableOrgUnits = useMemo(() => {
    const effectiveRoleId = getEffectiveRoleId(form.role, userQuery.data?.role);
    const filteredOrgUnits = filterOrgUnitsForUserRole(
      orgUnitsQuery.data ?? [],
      effectiveRoleId,
      userQuery.data?.region?.id ?? null,
    );
    const currentOrgUnit = userQuery.data?.orgUnit;
    const currentOrgUnitId = currentOrgUnit ? getUserOrgUnitSelectionId(currentOrgUnit) : null;
    const currentRoleId = toEntityId(userQuery.data?.role?.id);

    if (!currentOrgUnit || filteredOrgUnits.some((orgUnit) => orgUnit.id === currentOrgUnitId)) {
      return filteredOrgUnits;
    }

    if (isOrgUnitTouched || effectiveRoleId !== currentRoleId) {
      return filteredOrgUnits;
    }

    const fallbackOrgUnit = getUserOrgUnitFallbackOption(
      currentOrgUnit,
      userQuery.data?.region?.id ?? null,
      userQuery.data?.region?.name,
    );

    return [
      fallbackOrgUnit,
      ...filteredOrgUnits,
    ];
  }, [form.role, isOrgUnitTouched, orgUnitsQuery.data, userQuery.data?.orgUnit, userQuery.data?.region, userQuery.data?.role]);
  const autoLockedOrgUnit = useMemo(
    () =>
      getAutoLockedOrgUnitForUserRole(
        availableOrgUnits,
        effectiveFormRoleId,
        userQuery.data?.region?.id ?? null,
      ),
    [availableOrgUnits, effectiveFormRoleId, userQuery.data?.region?.id],
  );

  useEffect(() => {
    if (!autoLockedOrgUnit || form.org_unit === autoLockedOrgUnit.id) {
      return;
    }

    setIsOrgUnitTouched(true);
    setForm((current) => ({ ...current, org_unit: autoLockedOrgUnit.id }));
  }, [autoLockedOrgUnit, form.org_unit]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (userQuery.data && isFederalManager(userQuery.data)) {
      return;
    }

    const canEditUsername = isManagementRole(userQuery.data?.role ?? null);
    const nextPhoneError = getPhoneError(form.phone);
    const nextUsernameError = canEditUsername ? getUsernameError(form.username) : null;

    setPhoneError(nextPhoneError);
    setUsernameError(nextUsernameError);

    if (nextPhoneError || nextUsernameError) {
      return;
    }

    const effectiveRoleId = getEffectiveRoleId(form.role, userQuery.data?.role);
    const effectiveOrgUnitId = getEffectiveOrgUnitId(form.org_unit, userQuery.data?.orgUnit, isOrgUnitTouched);
    const payload: UserPatchPayload = {
      full_name: form.full_name,
      phone: form.phone,
      birthday: form.birthday || null,
      role: effectiveRoleId,
      org_unit: userQuery.data?.orgUnit ? toEntityId(userQuery.data.orgUnit.id) : null,
      parent_org_unit: canSelectOrgUnit(effectiveRoleId) ? effectiveOrgUnitId : null,
    };

    if (canEditUsername) {
      payload.username = form.username;
    }

    updateMutation.mutate(payload);
  }

  if (!Number.isFinite(parsedUserId)) {
    return <UserProfileMessage text="Некорректный id пользователя." tone="error" />;
  }

  if (userQuery.isLoading) {
    return <UserProfileMessage text="Загружаем пользователя..." />;
  }

  if (userQuery.isError || !userQuery.data) {
    return <UserProfileMessage text="Не удалось загрузить пользователя." tone="error" />;
  }

  const user = userQuery.data;
  const isLockedFederalManager = isFederalManager(user);
  const isUserOnModeration = user.status === 'moderation';
  const isRoleAndOrgUnitLocked = isTopManager(user);
  const showUsername = isManagementRole(user.role);
  const showMaxUserId = !isTopManager(user);
  const effectiveOrgUnitId = getEffectiveOrgUnitId(form.org_unit, user.orgUnit, isOrgUnitTouched);
  const initialOrgUnitSelectionId = user.orgUnit ? getUserOrgUnitSelectionId(user.orgUnit) : null;
  const selectedOrgUnitFallback =
    user.orgUnit && effectiveOrgUnitId === initialOrgUnitSelectionId
      ? {
          label: getUserOrgUnitDisplayName(user.orgUnit),
          description: user.region?.name,
        }
      : undefined;
  const selectedRoleLabel =
    availableRoleOptions.find((role) => role.id === effectiveFormRoleId)?.label ?? user.role?.name ?? 'Выберите роль';

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Button asChild variant="ghost" className="h-auto justify-start px-0 text-slate-600">
              <Link to="/users">
                <ArrowLeft />
                Все пользователи
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold !text-slate-900">{user.fullName}</h1>
              {showUsername && <p className="text-sm text-slate-500">@{user.username}</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={`w-fit rounded-md border-0 px-2.5 py-1 text-xs font-medium ${
                user.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {getUserStatusLabel(user)}
            </Badge>
            {!isUserOnModeration && (
              <Button
                type="button"
                variant={user.active ? 'destructive' : 'outline'}
                disabled={toggleActiveMutation.isPending || isLockedFederalManager}
                onClick={() => setToggleActiveConfirmOpen(true)}
              >
                {user.active ? <PowerOff /> : <Power />}
                {user.active ? 'Деактивировать' : 'Активировать'}
              </Button>
            )}
          </div>
        </div>

        <Card className="gap-0 border-slate-200 bg-white shadow-sm">
          <CardContent className="px-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <h2 className="text-xl font-semibold !text-slate-900">Основная информация</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Статус меняется только кнопкой активации или деактивации.
                </p>
                {isLockedFederalManager && (
                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Федерального управляющего нельзя редактировать, активировать или деактивировать.
                  </div>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {showUsername && (
                  <Field label="Логин">
                    <Input
                      disabled={isLockedFederalManager}
                      className={usernameError ? 'border-red-400 focus-visible:ring-red-200' : undefined}
                      value={form.username}
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
                )}

                <Field label="ФИО">
                  <Input
                    disabled={isLockedFederalManager}
                    value={form.full_name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, full_name: event.target.value }))
                    }
                    required
                  />
                </Field>

                {showMaxUserId && (
                  <Field label="ID пользователя в MAX">
                    <Input
                      disabled
                      value={form.max_user_id}
                    />
                  </Field>
                )}

                <Field label="Телефон">
                  <Input
                    disabled={isLockedFederalManager}
                    className={phoneError ? 'border-red-400 focus-visible:ring-red-200' : undefined}
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

                <Field label="Дата рождения">
                  <DatePicker
                    disabled={isLockedFederalManager}
                    value={parseDateOnly(form.birthday)}
                    onChange={(birthday) =>
                      setForm((current) => ({
                        ...current,
                        birthday: birthday ? toDateOnly(birthday) : '',
                      }))
                    }
                    placeholder="Выберите дату"
                  />
                </Field>

                <ReadonlyField label="Статус" value={getUserStatusLabel(user)} />
                <ReadonlyField label="Дата создания" value={formatDateTime(user.createdAt)} />
              </div>

              <div className="grid gap-5 md:grid-cols-4">
                <Field label="Роль">
                  <Select
                    value={getSelectRoleValue(effectiveFormRoleId, availableRoleOptions)}
                    disabled={isRoleAndOrgUnitLocked}
                    onValueChange={(role) => {
                      const nextRole = Number(role);

                      if (
                        !Number.isInteger(nextRole) ||
                        !availableRoleOptions.some((option) => option.id === nextRole) ||
                        nextRole === effectiveFormRoleId
                      ) {
                        return;
                      }

                      setIsOrgUnitTouched(true);
                      setForm((current) => ({
                        ...current,
                        role: nextRole,
                        org_unit: null,
                      }));
                    }}
                  >
                    <SelectTrigger className="w-full border-slate-200 bg-white text-slate-900 [&_[data-slot=select-value]]:text-slate-900">
                      <SelectValue placeholder={selectedRoleLabel} />
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
                <ReadonlyField label="Регион" value={user.region?.name ?? 'Не указан'} />
                <div className="md:col-span-2">
                  <Field label="Структура подчинения">
                  {canSelectOrgUnit(effectiveFormRoleId) ? (
                    <div className="space-y-2">
                      <SearchSelect
                        placeholder={user.region ? 'Выберите структуру подчинения' : 'Сначала укажите регион'}
                        searchPlaceholder="Поиск структуры подчинения"
                        loading={orgUnitsQuery.isLoading}
                        disabled={isRoleAndOrgUnitLocked || !user.region || Boolean(autoLockedOrgUnit)}
                        value={effectiveOrgUnitId}
                        selectedFallback={selectedOrgUnitFallback}
                        options={availableOrgUnits.map((orgUnit) => ({
                          id: orgUnit.id,
                          label:
                            orgUnit.id === initialOrgUnitSelectionId && user.orgUnit
                              ? getUserOrgUnitDisplayName(user.orgUnit)
                              : `${'  '.repeat(orgUnit.depth)}${orgUnit.name}`,
                          description: getOrgUnitDescription(orgUnit),
                        }))}
                        onChange={(org_unit) => {
                          setIsOrgUnitTouched(true);
                          setForm((current) => ({ ...current, org_unit }));
                        }}
                      />
                      {effectiveOrgUnitId !== null &&
                        effectiveOrgUnitId !== 0 &&
                        !isRoleAndOrgUnitLocked &&
                        !autoLockedOrgUnit && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-auto px-0 text-xs font-medium text-slate-500 hover:bg-transparent hover:text-slate-900"
                          onClick={() => {
                            setIsOrgUnitTouched(true);
                            setForm((current) => ({ ...current, org_unit: null }));
                          }}
                        >
                          Убрать структуру
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Не требуется для выбранной роли</p>
                  )}
                  </Field>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <ReadonlyField label="Руководитель" value={formatHeadUser(user.headUser)} />
                {typeof user.headUser === 'object' && user.headUser?.role && (
                  <ReadonlyField label="Роль руководителя" value={user.headUser.role} />
                )}
              </div>

              {updateMutation.isError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Не удалось сохранить пользователя.
                </div>
              )}

              {updateMutation.isSuccess && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  Данные пользователя сохранены.
                </div>
              )}

              <div className="flex justify-end border-t border-slate-200 pt-4">
                <Button
                  className="bg-[#465cd3] text-white hover:bg-[#3c50bd]"
                  disabled={updateMutation.isPending || isLockedFederalManager}
                >
                  <Save />
                  {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Dialog open={toggleActiveConfirmOpen} onOpenChange={setToggleActiveConfirmOpen}>
          <DialogContent className="max-w-[460px]">
            <DialogHeader>
              <DialogTitle>{user.active ? 'Деактивировать пользователя?' : 'Активировать пользователя?'}</DialogTitle>
              <DialogDescription>
                {user.active
                  ? 'Пользователь будет деактивирован и потеряет доступ к активным действиям.'
                  : 'Пользователь будет активирован и снова сможет работать в системе.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setToggleActiveConfirmOpen(false)}
                disabled={toggleActiveMutation.isPending}
              >
                Отмена
              </Button>
              <Button
                type="button"
                variant={user.active ? 'destructive' : 'default'}
                disabled={toggleActiveMutation.isPending || isLockedFederalManager}
                onClick={() => {
                  toggleActiveMutation.mutate(user);
                  setToggleActiveConfirmOpen(false);
                }}
              >
                {toggleActiveMutation.isPending ? 'Выполняем...' : user.active ? 'Деактивировать' : 'Активировать'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {children}
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
  selectedFallback,
  options,
  onChange,
}: {
  placeholder: string;
  searchPlaceholder: string;
  loading: boolean;
  disabled?: boolean;
  value: number | null;
  selectedFallback?: {
    label: string;
    description?: string;
  };
  options: SearchOption[];
  onChange: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedOption = options.find((option) => option.id === value);
  const selectedLabel = selectedOption?.label.trim() ?? (value ? selectedFallback?.label : undefined);
  const selectedDescription = selectedOption?.description ?? (value ? selectedFallback?.description : undefined);
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
            <span className={cn('block truncate', selectedLabel ? 'text-slate-900' : 'text-slate-500')}>
              {selectedLabel ?? placeholder}
            </span>
            {selectedDescription && (
              <span className="block truncate text-xs text-slate-500">{selectedDescription}</span>
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

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="text-sm text-slate-900">{value}</p>
    </div>
  );
}

function UserProfileMessage({ text, tone = 'default' }: { text: string; tone?: 'default' | 'error' }) {
  return (
    <div className="min-h-full bg-slate-50 px-6 py-6">
      <div
        className={`mx-auto max-w-[900px] rounded-lg border p-8 text-center text-sm ${
          tone === 'error'
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-slate-200 bg-white text-slate-500'
        }`}
      >
        {text}
      </div>
    </div>
  );
}

function getInitialForm(user: UserDetails): UserFormState {
  return {
    username: user.username,
    full_name: user.fullName,
    max_user_id: user.maxUserId ?? '',
    phone: formatRussianPhone(user.phone ?? ''),
    birthday: user.birthday ?? '',
    role: toEntityId(user.role?.id),
    org_unit: user.orgUnit ? getUserOrgUnitSelectionId(user.orgUnit) : null,
  };
}

const emptyForm: UserFormState = {
  username: '',
  full_name: '',
  max_user_id: '',
  phone: '',
  birthday: '',
  role: null,
  org_unit: null,
};

function getPhoneError(value: string) {
  if (!value) {
    return 'Номер телефона обязателен.';
  }

  return isCompleteRussianPhone(value) ? null : 'Введите номер телефона полностью: 11 цифр.';
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

function getUserOrgUnitDisplayName(orgUnit: NonNullable<UserDetails['orgUnit']>) {
  return typeof orgUnit.parent === 'object' && orgUnit.parent?.name ? orgUnit.parent.name : orgUnit.name;
}

function getUserOrgUnitSelectionId(orgUnit: NonNullable<UserDetails['orgUnit']>) {
  return typeof orgUnit.parent === 'object' && orgUnit.parent
    ? toEntityId(orgUnit.parent.id)
    : toEntityId(orgUnit.id);
}

function getUserOrgUnitFallbackOption(
  orgUnit: NonNullable<UserDetails['orgUnit']>,
  regionId: number | null,
  regionName?: string | null,
): OrgUnit {
  const parent = typeof orgUnit.parent === 'object' ? orgUnit.parent : null;

  return {
    id: getUserOrgUnitSelectionId(orgUnit) ?? orgUnit.id,
    name: parent?.name ?? orgUnit.name,
    type: (parent?.type ?? orgUnit.type) as OrgUnit['type'],
    parentId: typeof orgUnit.parent === 'number' ? orgUnit.parent : null,
    regionId,
    regionName,
    headUser: null,
    depth: 0,
  };
}

function canSelectOrgUnit(role: number | null) {
  return role !== null && role !== 1 && role !== 2;
}

function getEffectiveOrgUnitId(
  formOrgUnitId: number | null,
  userOrgUnit: UserDetails['orgUnit'],
  isOrgUnitTouched: boolean,
) {
  if (isOrgUnitTouched) {
    return formOrgUnitId;
  }

  return formOrgUnitId ?? (userOrgUnit ? getUserOrgUnitSelectionId(userOrgUnit) : null);
}

function getEffectiveRoleId(formRoleId: number | null, userRole: UserDetails['role']) {
  return toEntityId(formRoleId) ?? toEntityId(userRole?.id);
}

function getSelectRoleValue(
  roleId: number | null,
  availableRoleOptions: Array<{ id: number; code: string; label: string }>,
) {
  return roleId !== null && availableRoleOptions.some((role) => role.id === roleId)
    ? String(roleId)
    : undefined;
}

function toEntityId(value: unknown) {
  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
}

function formatHeadUser(headUser: UserDetails['headUser']) {
  if (!headUser) {
    return 'Не указан';
  }

  if (typeof headUser === 'string') {
    return headUser || 'Не указан';
  }

  return headUser.full_name;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function parseDateOnly(value: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toDateOnly(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isFederalManager(user: Pick<UserDetails, 'role'>) {
  return user.role?.code === 'federal_manager' || user.role?.id === 1;
}

function isTopManager(user: Pick<UserDetails, 'role'>) {
  return isTopManagerByRole(user.role);
}

function isTopManagerByRole(role: UserDetails['role']) {
  return (
    role?.code === 'federal_manager' ||
    role?.code === 'regional_manager' ||
    role?.id === 1 ||
    role?.id === 2
  );
}
