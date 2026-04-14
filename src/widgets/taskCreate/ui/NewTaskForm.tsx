import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { DatePicker } from "@/shared/ui/date-picker";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

const taskTypes = ["Мониторинг", "Оповещение", "Проверка", "Сбор данных"];
const placementRegions = ["Москва", "Санкт-Петербург", "Брянская область", "Амурская область"];
const groups = ["Федеральная группа", "Региональная группа", "Оперативная группа"];
const roles = ["Координатор", "Наблюдатель", "Аналитик", "Модератор"];
const users = ["Пользователь X-01", "Пользователь X-02", "Пользователь X-03", "Пользователь X-04"];

export function NewTaskForm() {
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [delayedStart, setDelayedStart] = useState<Date | undefined>();
  const [assignmentMode, setAssignmentMode] = useState<"flow" | "point">("flow");

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-6 py-6">

        <div className="space-y-1">
          <h1 className="text-3xl font-semibold !text-slate-900">Новая задача</h1>
          <p className="text-sm text-slate-500">Заполни параметры задачи и настрой назначение исполнителей.</p>
        </div>

        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          
          <div className="flex items-center gap-3">
            <Checkbox id="global-task-v2" />
            <label htmlFor="global-task-v2" className="text-sm text-slate-700">
              Глобальная задача
            </label>
          </div>

          <Field label="Название задачи">
            <Input placeholder="Введите название задачи" className="border-slate-200" />
          </Field>

          <Field label="Описание задачи">
            <textarea
              className="min-h-[140px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-[color,box-shadow] placeholder:text-slate-400 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="Опишите задачу, ожидаемый результат и условия выполнения"
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Дедлайн">
              <DatePicker value={deadline} onChange={setDeadline} placeholder="Выберите дату дедлайна" />
            </Field>
            <Field label="Дата для отложенной активации задачи">
              <DatePicker value={delayedStart} onChange={setDelayedStart} placeholder="Выберите дату активации" />
            </Field>
          </div>

          <Field label="Тип задачи">
            <Select>
              <SelectTrigger className="w-full border-slate-200 bg-white">
                <SelectValue placeholder="Укажите тип задачи" />
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

          <Field label="Регион">
            <Select>
              <SelectTrigger className="w-full border-slate-200 bg-white">
                <SelectValue placeholder="Выберите регион для постановки" />
              </SelectTrigger>
              <SelectContent align="start">
                {placementRegions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Группы">
            <Select>
              <SelectTrigger className="w-full border-slate-200 bg-white">
                <SelectValue placeholder="Выберите группы для назначения задачи" />
              </SelectTrigger>
              <SelectContent align="start">
                {groups.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="text-sm font-medium text-slate-700">Назначение исполнителей</p>
              <button type="button" className="text-sm text-amber-600 hover:text-amber-700">
                показать исполнителей →
              </button>
            </div>
            <Select value={assignmentMode} onValueChange={(value) => setAssignmentMode(value as "flow" | "point")}>
              <SelectTrigger className="w-full border-slate-200 bg-white">
                <SelectValue placeholder="Выберите назначение исполнителей" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="flow">Сквозное</SelectItem>
                <SelectItem value="point">Точечное</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {assignmentMode === "point" && (
            <Field label="Пользователи">
              <Select>
                <SelectTrigger className="w-full border-slate-200 bg-white">
                  <SelectValue placeholder="Выберите пользователей для задачи" />
                </SelectTrigger>
                <SelectContent align="start">
                  {users.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field label="Ограничения по ролям пользователей">
            <Select>
              <SelectTrigger className="w-full border-slate-200 bg-white">
                <SelectValue placeholder="Выберите роли для ограничения списка исполнителей" />
              </SelectTrigger>
              <SelectContent align="start">
                {roles.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Число выполнений на команду">
              <Input defaultValue="8" className="border-slate-200" />
            </Field>
            <Field label="Лимит отчетов от исполнителя">
              <Input defaultValue="1" className="border-slate-200" />
            </Field>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox id="feedback-enabled-v2" />
            <label htmlFor="feedback-enabled-v2" className="text-sm text-slate-700">
              Включить сбор обратной связи
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <Button asChild variant="outline" className="border-slate-200">
              <Link to="/tasks">К списку задач</Link>
            </Button>
            <Button variant="outline" className="border-slate-200">
              Сохранить как черновик
            </Button>
            <Button className="bg-[#465cd3] text-white hover:bg-[#3c50bd]">Создать задачу</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 !mb-1">{label}</p>
      {children}
    </div>
  );
}


