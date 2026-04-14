import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { DatePicker } from "@/shared/ui/date-picker";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

const pageRegions = [
  "Все регионы",
  "Алтайский край",
  "Амурская область",
  "Архангельская область",
  "Астраханская область",
  "Белгородская область",
  "Брянская область",
  "Владимирская область",
  "Волгоградская область",
  "Вологодская область",
  "Воронежская область",
  "Донецкая Народная Республика",
  "Еврейская автономная область",
  "Забайкальский край",
  "Запорожская область",
  "Ивановская область",
  "Иркутская область",
];

const taskTypes = ["Мониторинг", "Проверка", "Оповещение", "Сопровождение"];
const taskItems = ["Выберите задачу", "Отчет по сети", "Региональная активность", "Аналитика по ролям"];

export function RegionsDashboard() {
  const [region, setRegion] = useState(pageRegions[0]);
  const [period, setPeriod] = useState<Date | undefined>();
  const [networkScope, setNetworkScope] = useState<"federal" | "regional">("federal");

  return (
    <div className="min-h-full bg-slate-50">

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold !text-slate-900">Регион</h1>
          <p className="text-sm text-slate-500">Подключенные регионы и численность сети по выбранному периоду.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <Card className="gap-0 border-slate-200 bg-white shadow-sm">
            <CardContent className="px-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold !text-slate-900">Подключенные регионы</h2>
                  <p className="text-xs text-slate-500">Список регионов сети</p>
                </div>

                <ScrollArea className="h-[420px] pr-2">
                  <div className="space-y-1">
                    {pageRegions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setRegion(item)}
                        className={`flex w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                          region === item ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 border-slate-200 bg-white shadow-sm">
            <CardContent className="px-6">
              <div className="space-y-6">
                <p className="text-[27px] font-semibold !text-slate-900">
                  Все регионы
                </p>
                <p className="text-[23px] font-semibold !text-slate-900 pb-2">
                  Численность сети: 54876
                </p>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setNetworkScope("federal")}
                        className={`h-9 w-24 rounded-md border text-sm font-medium transition-colors ${
                          networkScope === "federal"
                            ? "border-sky-500 bg-sky-500 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      />
                      <span className="text-base font-medium text-slate-700">Федеральные</span>
                    </div>

                    <Field label="Выберите период" className="max-w-[450px]">
                      <DatePicker value={period} onChange={setPeriod} placeholder="Выберите дату" />
                    </Field>

                    <Field label="Задача" className="max-w-[450px]">
                      <Select>
                        <SelectTrigger className="w-full border-slate-200 bg-white">
                          <SelectValue placeholder="Выберите задачу" />
                        </SelectTrigger>
                        <SelectContent align="start">
                          {taskItems.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setNetworkScope("regional")}
                        className={`h-9 w-24 rounded-md border text-sm font-medium transition-colors ${
                          networkScope === "regional"
                            ? "border-sky-500 bg-sky-500 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      />
                      <span className="text-base font-medium text-slate-700">Региональные</span>
                    </div>

                    <Field label="Выберите тип задач" className="max-w-[450px]">
                      <Select>
                        <SelectTrigger className="w-full border-slate-200 bg-white">
                          <SelectValue placeholder="Выберите тип задач" />
                        </SelectTrigger>
                        <SelectContent align="start">
                          {taskTypes.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <div className="flex justify-end pt-8">
                      <Button className="bg-[#465cd3] text-white hover:bg-[#3c50bd]">Показать</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className
}: {
  label: string;
  children: React.ReactNode;
  className?: string
}) {
  return (
    <div className={`space-y-2 ${className || ''}`}>
      <p className="text-sm font-medium text-slate-700 !mb-1">{label}</p>
      {children}
    </div>
  );
}
