import { ArrowLeft, BarChart3, ClipboardList, Eye, Home, Link2, Pencil, Shield, UserCog, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { mockUsers } from "@/widgets/userRegistry/ui/UserRegistryTable";

const sidebarItems = [
  { icon: Home, label: "Общая информация" },
  { icon: ClipboardList, label: "Отчеты по задачам" },
  { icon: BarChart3, label: "Статистика по задачам" },
  { icon: Link2, label: "Ссылки на соцсети" },
  { icon: Shield, label: "Лояльность" },
  { icon: Users, label: "Пройденные семинары" },
  { icon: UserCog, label: "Подчиненные" },
  { icon: Pencil, label: "Действия" },
  { icon: Eye, label: "Активность в ТГ" },
];

export function UserProfileCard() {
  const { userId } = useParams();
  const user = mockUsers.find((item) => String(item.id) === userId) ?? mockUsers[0];

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold !text-slate-900">
            <span className="">Пользователь</span> {user.name}
          </h1>
        </div>

        <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
          <Card className="gap-0 border-slate-200 bg-white shadow-sm">
            <CardContent className="px-4">
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start border-slate-200">
                  <Pencil />
                  Редактировать
                </Button>

                <div className="space-y-1">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.label}
                        type="button"
                        className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          item.label === "Общая информация"
                            ? "bg-slate-100 text-slate-900"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <Button asChild variant="ghost" className="w-full justify-start text-slate-600 hover:bg-slate-50">
                    <Link to="/users">
                      <ArrowLeft />
                      Все пользователи
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 border-slate-200 bg-white shadow-sm">
            <CardContent className="px-6">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold !text-slate-900">Общая информация</h2>

                <div className="grid gap-8 md:grid-cols-2">
                  <InfoColumn
                    items={[
                      ["Дата регистрации", "2026-03-27 07:01:25"],
                      ["Дата рождения", "2005-09-16"],
                      ["Организация", "не указана"],
                      ["Логин в телеграм", user.nickname],
                      ["Идентификатор в телеграм", "не указан"],
                      ["Телефон", "+7 (900) 000-00-00"],
                    ]}
                  />

                  <InfoColumn
                    items={[
                      ["Группа", user.group],
                      ["Роль", user.role],
                      ["Команды", user.manager],
                      ["Задачи", "задач: 0 / отчетов: 0"],
                      ["Позиция на карте", "показать на карту"],
                      ["Руководитель", `${user.manager}\nДемо-куратор • уровень 3`],
                      ["Подчиненные", "не назначены"],
                      ["Используемые боты", "или используемые"],
                    ]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoColumn({
  items,
}: {
  items: [string, string][];
}) {
  return (
    <div className="space-y-5">
      {items.map(([label, value]) => (
        <div key={label} className="space-y-1">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="whitespace-pre-line text-sm text-slate-900">{value}</p>
        </div>
      ))}
    </div>
  );
}


