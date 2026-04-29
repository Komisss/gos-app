import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';

import { activateUser, deactivateUser, getUsers } from '@/entities/user/api/users';
import type { UserListItem } from '@/entities/user/model/types';
import { Button } from '@/shared/ui/button';
import { UserRegistryTable } from './UserRegistryTable';

export function UserRegistry() {
  const queryClient = useQueryClient();
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null);

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (user: UserListItem) => (user.active ? deactivateUser(user.id) : activateUser(user.id)),
    onMutate: (user) => setTogglingUserId(user.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onSettled: () => setTogglingUserId(null),
  });

  const users = usersQuery.data ?? [];

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold !text-slate-900">Список пользователей</h1>
            <div className="space-y-1 text-sm text-slate-500">
              <p>Итого</p>
              <p className="text-base font-semibold text-slate-900">{users.length}</p>
            </div>
          </div>

          <Button className="bg-[#6d79ea] text-white hover:bg-[#5c67d9]">
            <Download />
            Скачать XLSX
          </Button>
        </div>

        {usersQuery.isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Загружаем пользователей...
          </div>
        ) : usersQuery.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
            Не удалось загрузить список пользователей.
          </div>
        ) : (
          <UserRegistryTable
            users={users}
            togglingUserId={togglingUserId}
            onToggleActive={(user) => toggleActiveMutation.mutate(user)}
          />
        )}
      </div>
    </div>
  );
}
