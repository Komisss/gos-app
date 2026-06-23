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
import type { UserDetails, UserPatchPayload } from '@/entities/user/model/types';
import { isManagementRole } from '@/entities/user/lib/isManagementRole';
import { formatRussianPhone, isCompleteRussianPhone } from '@/shared/lib/russianPhone';
import { getUsernameError } from '@/shared/lib/username';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { DatePicker } from '@/shared/ui/date-picker';
import { Input } from '@/shared/ui/input';
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
};

export function UserProfileCard() {
  const { userId } = useParams();
  const parsedUserId = Number(userId);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [toggleActiveConfirmOpen, setToggleActiveConfirmOpen] = useState(false);

  const userQuery = useQuery({
    queryKey: ['users', parsedUserId],
    queryFn: () => getUserById(parsedUserId),
    enabled: Number.isFinite(parsedUserId),
  });

  useEffect(() => {
    if (userQuery.data) {
      setForm(getInitialForm(userQuery.data));
      setPhoneError(null);
      setUsernameError(null);
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

    const payload: UserPatchPayload = {
      full_name: form.full_name,
      max_user_id: form.max_user_id,
      phone: form.phone,
      birthday: form.birthday || null,
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
  const showUsername = isManagementRole(user.role);

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
            <Button
              type="button"
              variant={user.active ? 'destructive' : 'outline'}
              disabled={toggleActiveMutation.isPending || isLockedFederalManager}
              onClick={() => setToggleActiveConfirmOpen(true)}
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

                <Field label="ID пользователя в MAX">
                  <Input
                    disabled={isLockedFederalManager}
                    value={form.max_user_id}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, max_user_id: event.target.value }))
                    }
                  />
                </Field>

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

              <div className="grid gap-5 md:grid-cols-3">
                <ReadonlyField label="Роль" value={user.role?.name ?? 'Не указана'} />
                <ReadonlyField label="Регион" value={user.region?.name ?? 'Не указан'} />
                <ReadonlyField
                  label="Структура подчинения"
                  value={user.orgUnit?.name ?? 'Не указана'}
                />
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
  };
}

const emptyForm: UserFormState = {
  username: '',
  full_name: '',
  max_user_id: '',
  phone: '',
  birthday: '',
};

function getPhoneError(value: string) {
  if (!value) {
    return 'Номер телефона обязателен.';
  }

  return isCompleteRussianPhone(value) ? null : 'Введите номер телефона полностью: 11 цифр.';
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
