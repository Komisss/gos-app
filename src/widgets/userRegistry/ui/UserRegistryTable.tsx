import { Power, PowerOff } from 'lucide-react';

import { getUserStatusLabel } from '@/entities/user/api/users';
import type { UserListItem } from '@/entities/user/model/types';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { TableScrollArea } from '@/shared/ui/table-scroll-area';

type Props = {
  users: UserListItem[];
  togglingUserId?: number | null;
  onToggleActive: (user: UserListItem) => void;
};

export function UserRegistryTable({ users, togglingUserId, onToggleActive }: Props) {
  return (
    <TableScrollArea headerHeight="3rem" height="68vh">
      <Table className="min-w-[1040px] whitespace-nowrap">
        <TableHeader>
          <TableRow className="border-b-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
            <TableHead className="w-24">#</TableHead>
            <TableHead className="min-w-[240px]">Пользователь</TableHead>
            <TableHead className="min-w-[180px]">Роль</TableHead>
            <TableHead className="min-w-[220px]">Регион</TableHead>
            <TableHead className="min-w-[220px]">Оргструктура</TableHead>
            <TableHead className="w-32">Статус</TableHead>
            <TableHead className="w-20 text-right" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                Пользователей пока нет.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user, index) => (
              <TableRow
                key={user.id}
                className={`cursor-pointer align-top border-b-slate-200 hover:bg-slate-50/60 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-100'
                }`}
                onClick={() => openInNewTab(`/users/${user.id}`)}
              >
                <TableCell className="text-slate-700">{user.id}</TableCell>
                <TableCell className="min-w-[240px]">
                  <div className="space-y-1 whitespace-normal">
                    <div className="text-sm font-medium text-slate-900">{user.fullName}</div>
                    <div className="text-xs text-slate-500">@{user.username}</div>
                  </div>
                </TableCell>
                <TableCell className="text-slate-700">{user.role?.name ?? 'Не указана'}</TableCell>
                <TableCell className="text-slate-700">{user.region?.name ?? 'Не указан'}</TableCell>
                <TableCell className="min-w-[220px] whitespace-normal text-slate-700">
                  {user.orgUnit?.name ?? 'Не указана'}
                </TableCell>
                <TableCell>
                  <Badge
                    className={`rounded-md border-0 px-2.5 py-1 text-xs font-medium ${
                      user.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {getUserStatusLabel(user)}
                  </Badge>
                </TableCell>
                <TableCell className="pt-3 text-right">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    disabled={togglingUserId === user.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleActive(user);
                    }}
                    aria-label={user.active ? 'Деактивировать пользователя' : 'Активировать пользователя'}
                  >
                    {user.active ? <PowerOff size={15} /> : <Power size={15} />}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableScrollArea>
  );
}

function openInNewTab(path: string) {
  const openedWindow = window.open(path, '_blank', 'noopener,noreferrer');
  if (openedWindow) {
    openedWindow.opener = null;
  }
}
