import type { ReactNode } from 'react';

import type { SessionSnapshot } from '@/features/auth/model/tokenStorage';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';

type ProfileFormProps = {
  user: SessionSnapshot | null;
};

export function ProfileForm({ user }: ProfileFormProps) {
  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold !text-slate-900">Профиль</h1>
          <p className="text-sm text-slate-500">Данные текущего пользователя.</p>
        </div>

        <Card className="gap-0 border-slate-200 bg-white shadow-sm">
          <CardContent className="grid gap-5 px-6 py-6 md:max-w-2xl">
            <ReadonlyField label="ФИО" value={user?.fullName ?? 'Не указано'} />
            <ReadonlyField label="Username" value={user?.username ? `@${user.username}` : 'Не указан'} />
            <ReadonlyField label="Роль" value={user?.role?.name ?? 'Не указана'} />
            <ReadonlyField label="Код роли" value={user?.role?.code ?? 'Не указан'} />
            <ReadonlyField label="ID роли" value={user?.role?.id ?? 'Не указан'} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <Input className="border-slate-200 bg-slate-50 text-slate-900" readOnly value={String(value)} />
    </div>
  );
}
