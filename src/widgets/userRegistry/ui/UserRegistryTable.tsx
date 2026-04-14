import { Pencil, UserPlus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { TableScrollArea } from "@/shared/ui/table-scroll-area";

export type UserRow = {
  id: number;
  name: string;
  nickname: string;
  role: string;
  teams: number;
  manager: string;
  group: string;
  status: "active" | "inactive";
};

type Props = {
  users: UserRow[];
};

export function UserRegistryTable({ users }: Props) {
  const navigate = useNavigate();

  return (
    <TableScrollArea headerHeight="5rem" height="68vh">
      <Table className="min-w-[1180px] whitespace-nowrap">
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b-slate-200">
              <TableHead className="w-24">#</TableHead>
              <TableHead className="min-w-[220px]">Имя</TableHead>
              <TableHead className="min-w-[180px]">Роли</TableHead>
              <TableHead className="w-20 text-center">Команды</TableHead>
              <TableHead className="min-w-[220px]">Куратор</TableHead>
              <TableHead className="min-w-[180px]">Группы</TableHead>
              <TableHead className="w-28">Статус</TableHead>
              <TableHead className="w-28 text-right" />
            </TableRow>
            <TableRow className="border-b bg-white hover:bg-white border-b-slate-200">
              <TableCell className="w-24">
                <Input className="h-8 border-slate-200 text-xs" />
              </TableCell>
              <TableCell className="min-w-[220px]">
                <Input className="h-8 border-slate-200 text-xs" />
              </TableCell>
              <TableCell className="min-w-[180px]">
                <Input className="h-8 border-slate-200 text-xs" />
              </TableCell>
              <TableCell className="w-20">
                <Input className="h-8 border-slate-200 text-xs" />
              </TableCell>
              <TableCell className="min-w-[220px]">
                <Input className="h-8 border-slate-200 text-xs" />
              </TableCell>
              <TableCell className="min-w-[180px]">
                <Input className="h-8 border-slate-200 text-xs" />
              </TableCell>
              <TableCell className="w-28">
                <Input className="h-8 border-slate-200 text-xs" />
              </TableCell>
              <TableCell className="w-28" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.map((user, index) => (
              <TableRow
                key={user.id}
                className={`cursor-pointer  align-top hover:bg-slate-50/60 border-b-slate-200 ${index % 2 === 0 ? "bg-white" : "bg-slate-100"}`}
                onClick={() => navigate(`/users/${user.id}`)}
              >
                <TableCell className="pt text-slate-700">{user.id}</TableCell>
                <TableCell className="min-w-[220px] pt">
                  <div className="space-y-1 whitespace-normal">
                    <div className="text-sm font-medium text-slate-900">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.nickname}</div>
                  </div>
                </TableCell>
                <TableCell className="pt text-slate-700">{user.role}</TableCell>
                <TableCell className="pt text-center text-slate-700">{user.teams}</TableCell>
                <TableCell className="min-w-[220px] pt whitespace-normal text-slate-700">
                  {user.manager}
                </TableCell>
                <TableCell className="pt text-slate-700">{user.group}</TableCell>
                <TableCell className="pt">
                  <span
                    className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${
                      user.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {user.status === "active" ? "активный" : "неактивный"}
                  </span>
                </TableCell>
                <TableCell className="pt-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Pencil size={15} />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <UserPlus size={15} />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
      </Table>
    </TableScrollArea>
  );
}

export const mockUsers: UserRow[] = [
  {
    id: 165949,
    name: "Пользователь A-101",
    nickname: "@demo_user_101",
    role: "0 уровень",
    teams: 0,
    manager: "Куратор Alpha",
    group: "Тестовый сектор Север",
    status: "active",
  },
  {
    id: 165947,
    name: "Пользователь A-102",
    nickname: "@demo_user_102",
    role: "0 уровень",
    teams: 0,
    manager: "Куратор Beta",
    group: "Тестовый сектор Восток",
    status: "active",
  },
  {
    id: 165946,
    name: "Пользователь A-103",
    nickname: "@demo_user_103",
    role: "0 уровень",
    teams: 0,
    manager: "Куратор Gamma",
    group: "Тестовый сектор Центр",
    status: "active",
  },
  {
    id: 165945,
    name: "Пользователь A-104",
    nickname: "@demo_user_104",
    role: "Контент-мейкер (0)",
    teams: 0,
    manager: "Куратор Delta",
    group: "Тестовый сектор Юг",
    status: "active",
  },
  {
    id: 165944,
    name: "Пользователь A-105",
    nickname: "@demo_user_105",
    role: "0 уровень",
    teams: 0,
    manager: "Куратор Epsilon",
    group: "Тестовый сектор Запад",
    status: "active",
  },
    {
    id: 165944,
    name: "Пользователь A-106",
    nickname: "@demo_user_106",
    role: "0 уровень",
    teams: 0,
    manager: "Куратор Epsilon",
    group: "Тестовый сектор Запад",
    status: "active",
  },
    {
    id: 165944,
    name: "Пользователь A-107",
    nickname: "@demo_user_107",
    role: "0 уровень",
    teams: 0,
    manager: "Куратор Epsilon",
    group: "Тестовый сектор Запад",
    status: "active",
  },
    {
    id: 165944,
    name: "Пользователь A-108",
    nickname: "@demo_user_108",
    role: "0 уровень",
    teams: 0,
    manager: "Куратор Epsilon",
    group: "Тестовый сектор Запад",
    status: "active",
  },
    {
    id: 165944,
    name: "Пользователь A-109",
    nickname: "@demo_user_109",
    role: "0 уровень",
    teams: 0,
    manager: "Куратор Epsilon",
    group: "Тестовый сектор Запад",
    status: "active",
  },
    {
    id: 165944,
    name: "Пользователь A-110",
    nickname: "@demo_user_110",
    role: "0 уровень",
    teams: 0,
    manager: "Куратор Epsilon",
    group: "Тестовый сектор Запад",
    status: "active",
  },
    {
    id: 165944,
    name: "Пользователь A-111",
    nickname: "@demo_user_111",
    role: "0 уровень",
    teams: 0,
    manager: "Куратор Epsilon",
    group: "Тестовый сектор Запад",
    status: "active",
  },
    {
    id: 165944,
    name: "Пользователь A-112",
    nickname: "@demo_user_112",
    role: "0 уровень",
    teams: 0,
    manager: "Куратор Epsilon",
    group: "Тестовый сектор Запад",
    status: "active",
  },
];
