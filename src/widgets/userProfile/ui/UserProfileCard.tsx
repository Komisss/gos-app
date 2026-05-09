import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, Power, PowerOff, Save } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  activateUser,
  deactivateUser,
  getUserById,
  getUserStatusLabel,
  updateUser,
} from '@/entities/user/api/users';
import { getOrgUnitsTree } from '@/entities/orgUnit/api/orgUnits';
import { getRegions } from '@/entities/region/api/regions';
import type { UserDetails, UserPatchPayload } from '@/entities/user/model/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { DatePicker } from '@/shared/ui/date-picker';
import { FilterSearchSelect } from '@/shared/ui/filter-search-select';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

type UserFormState = {
  username: string;
  full_name: string;
  phone: string;
  birthday: string;
  role: string;
  region: string;
  org_unit: string;
};

const roleOptions = [
  { id: 1, code: 'federal_manager', label: 'Федеральный управляющий' },
  { id: 2, code: 'regional_manager', label: 'Региональный руководитель' },
  { id: 3, code: 'executor', label: 'Исполнитель' },
  { id: 4, code: 'main_manager', label: 'Главный менеджер' },
  { id: 5, code: 'assistant', label: 'Помощник главного менеджера' },
  { id: 6, code: 'unit_head', label: 'Руководитель управления' },
  { id: 7, code: 'department_head', label: 'Руководитель отдела' },
  { id: 8, code: 'employee', label: 'Сотрудник' },
];

export function UserProfileCard() {
  const { userId } = useParams();
  const parsedUserId = Number(userId);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UserFormState>(emptyForm);

  const userQuery = useQuery({
    queryKey: ['users', parsedUserId],
    queryFn: () => getUserById(parsedUserId),
    enabled: Number.isFinite(parsedUserId),
  });

  const regionsQuery = useQuery({
    queryKey: ['regions'],
    queryFn: getRegions,
  });

  const orgUnitsQuery = useQuery({
    queryKey: ['org-units-tree'],
    queryFn: getOrgUnitsTree,
  });

  useEffect(() => {
    if (userQuery.data) {
      setForm(getInitialForm(userQuery.data));
    }
  }, [userQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (payload: UserPatchPayload) => updateUser(parsedUserId, payload),
    onSuccess: async (updatedUser) => {
      setForm(getInitialForm(updatedUser));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        queryClient.invalidateQueries({ queryKey: ['users', parsedUserId] }),
      ]);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (user: UserDetails) => (user.active ? deactivateUser(user.id) : activateUser(user.id)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        queryClient.invalidateQueries({ queryKey: ['users', parsedUserId] }),
      ]);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateMutation.mutate({
      username: form.username,
      full_name: form.full_name,
      phone: form.phone,
      birthday: form.birthday || null,
      role: parseOptionalNumber(form.role),
      region: parseOptionalNumber(form.region),
      org_unit: parseOptionalNumber(form.org_unit),
    });
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
  const regions = regionsQuery.data ?? [];
  const orgUnits = orgUnitsQuery.data ?? [];
  const regionOptions = regions.map((region) => ({
    value: String(region.id),
    label: region.name,
    description: region.code,
  }));
  const orgUnitOptions = orgUnits.map((orgUnit) => ({
    value: String(orgUnit.id),
    label: `${'  '.repeat(orgUnit.depth)}${orgUnit.name}`,
    description: orgUnit.regionId ? getRegionName(orgUnit.regionId, regions) : undefined,
  }));

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
              <p className="text-sm text-slate-500">@{user.username}</p>
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
            <Button
              type="button"
              variant={user.active ? 'destructive' : 'outline'}
              disabled={toggleActiveMutation.isPending}
              onClick={() => toggleActiveMutation.mutate(user)}
            >
              {user.active ? <PowerOff /> : <Power />}
              {user.active ? 'Деактивировать' : 'Активировать'}
            </Button>
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
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Логин">
                  <Input
                    value={form.username}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, username: event.target.value }))
                    }
                    required
                  />
                </Field>

                <Field label="ФИО">
                  <Input
                    value={form.full_name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, full_name: event.target.value }))
                    }
                    required
                  />
                </Field>

                <Field label="Телефон">
                  <Input
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, phone: event.target.value }))
                    }
                  />
                </Field>

                <Field label="Дата рождения">
                  <DatePicker
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

              <div className="grid gap-5 md:grid-cols-3">
                <Field label="Роль">
                  <Select
                    value={form.role || undefined}
                    onValueChange={(role) => setForm((current) => ({ ...current, role }))}
                  >
                    <SelectTrigger className="h-9 w-full border-slate-200 bg-white">
                      <SelectValue placeholder={user.role?.name ?? 'Роль не указана'} />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.id} value={String(role.id)}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {user.role?.code && <p className="text-xs text-slate-500">{user.role.code}</p>}
                </Field>

                <FilterSearchSelect
                  label="Регион"
                  value={form.region}
                  placeholder="Регион не указан"
                  searchPlaceholder="Поиск региона"
                  options={regionOptions}
                  onChange={(region) => setForm((current) => ({ ...current, region }))}
                />

                <FilterSearchSelect
                  label="Оргструктура"
                  value={form.org_unit}
                  placeholder="Оргструктура не указана"
                  searchPlaceholder="Поиск оргструктуры"
                  options={orgUnitOptions}
                  onChange={(org_unit) => setForm((current) => ({ ...current, org_unit }))}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <ReadonlyField label="Руководитель" value={user.headUser?.full_name ?? 'Не указан'} />
                <ReadonlyField label="Роль руководителя" value={user.headUser?.role ?? 'Не указана'} />
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
                <Button className="bg-[#465cd3] text-white hover:bg-[#3c50bd]" disabled={updateMutation.isPending}>
                  <Save />
                  {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
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

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-slate-500">{label}</p>
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
    phone: user.phone ?? '',
    birthday: user.birthday ?? '',
    role: user.role ? String(user.role.id) : '',
    region: user.region ? String(user.region.id) : '',
    org_unit: user.orgUnit ? String(user.orgUnit.id) : '',
  };
}

const emptyForm: UserFormState = {
  username: '',
  full_name: '',
  phone: '',
  birthday: '',
  role: '',
  region: '',
  org_unit: '',
};

function parseOptionalNumber(value: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function getRegionName(regionId: number, regions: Array<{ id: number; name: string }>) {
  return regions.find((region) => region.id === regionId)?.name ?? `Регион #${regionId}`;
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
