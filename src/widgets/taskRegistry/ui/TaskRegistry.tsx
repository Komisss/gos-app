import { useState } from "react";
import { Plus } from "lucide-react";

import type { Task } from "@/entities/task/model/types";
import { Button } from "@/shared/ui/button";
import { CardTitle } from "@/shared/ui/card";
import { TaskDetailsDialog } from "@/widgets/taskDetails/ui/TaskDetailsDialog";
import { TaskRegistryTable } from "./TaskRegistryTable";

type Props = {
  tasks: Task[];
};

export function TaskRegistry({ tasks }: Props) {
  const data = tasks.length > 1 ? tasks : demoTasks;
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-3xl font-semibold text-slate-900">
              Задачи
            </CardTitle>
            <p className="text-sm text-slate-500">
              Список задач с быстрым поиском и оперативными действиями.
            </p>
          </div>

          <Button className="bg-[#465cd3] text-white hover:bg-[#3c50bd]">
            <Plus />
            Добавить задачу
          </Button>
        </div>

        <TaskRegistryTable tasks={data} onTaskClick={setSelectedTask} />

        <TaskDetailsDialog
          open={selectedTask !== null}
          task={selectedTask}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTask(null);
            }
          }}
        />
      </div>
    </div>
  );
}

const demoTasks: Task[] = [
  {
    id: 139793,
    title: "Проверка демонстрационного сценария",
    subtitle: "Тестовый контур → Категория A",
    department: "Демо-подразделение №1",
    type: "ТСТ",
    region: "Тестовый регион",
    assignee: "Пользователь A-01",
    assigneeMeta: "Уровень 3 • Тестовый регион",
    activityLabel: "Задача активируется",
    activityStart: "2026-03-25 00:00:00",
    activityEnd: "2026-03-25 20:00:00",
    counters: ["318", "4", "1", "0", "n/a", "n/a"],
    status: "completed",
    statusLabel: "Завершена",
    category: "Тестовый контур → Категория A",
    author: "Системный инициатор",
    deadlineLabel: "2026-03-25 20:00:00",
    assignedExecutors: 318,
    reportsCount: 4,
    description:
      "Это демонстрационная задача для проверки отображения карточки, кнопок и таблицы отчетов в интерфейсе.",
    questions: "Вопросы: 1 демонстрационный пункт",
    answerFormat: "Ответ: вложение или текст",
    performerSummary:
      "Пользователь A-01 / Уровень 3 / Тестовый регион",
    aggregatedTasksLabel: "Показать все агрегированные задачи",
    reports: [
      {
        id: 11609252,
        author: "Исполнитель B-17",
        authorMeta: "Уровень 1",
        team: "Команда 01",
        contentPreview: "Демонстрационное вложение с примером результата.",
        attachmentLabel: "Превью отчета",
        status: "На проверке у модератора",
        createdAt: "2026-03-25 18:42:00",
      },
            {
        id: 11609252,
        author: "Исполнитель B-18",
        authorMeta: "Уровень 1",
        team: "Команда 01",
        contentPreview: "Демонстрационное вложение с примером результата.",
        attachmentLabel: "Превью отчета",
        status: "На проверке у модератора",
        createdAt: "2026-03-25 18:42:00",
      },
            {
        id: 11609252,
        author: "Исполнитель B-19",
        authorMeta: "Уровень 1",
        team: "Команда 02",
        contentPreview: "Демонстрационное вложение с примером результата.",
        attachmentLabel: "Превью отчета",
        status: "На проверке у модератора",
        createdAt: "2026-03-25 18:42:00",
      },
            {
        id: 11609252,
        author: "Исполнитель B-20",
        authorMeta: "Уровень 1",
        team: "Команда 02",
        contentPreview: "Демонстрационное вложение с примером результата.",
        attachmentLabel: "Превью отчета",
        status: "На проверке у модератора",
        createdAt: "2026-03-25 18:42:00",
      },
            {
        id: 11609252,
        author: "Исполнитель B-21",
        authorMeta: "Уровень 1",
        team: "Команда 03",
        contentPreview: "Демонстрационное вложение с примером результата.",
        attachmentLabel: "Превью отчета",
        status: "На проверке у модератора",
        createdAt: "2026-03-25 18:42:00",
      },
            {
        id: 11609252,
        author: "Исполнитель B-22",
        authorMeta: "Уровень 1",
        team: "Команда 03",
        contentPreview: "Демонстрационное вложение с примером результата.",
        attachmentLabel: "Превью отчета",
        status: "На проверке у модератора",
        createdAt: "2026-03-25 18:42:00",
      },
      
    ],
  },
  {
    id: 140008,
    title: "Демо-сбор координат по шаблону",
    subtitle: "Тестовый сценарий",
    department: "Демо-подразделение №2",
    type: "ДМ1",
    region: "Учебный округ",
    assignee: "Пользователь C-02",
    assigneeMeta: "Сектор B • Уровень 1",
    activityStart: "от 2026-03-26 16:49:56",
    activityEnd: "до 2026-03-27 20:00:00",
    counters: ["8", "2", "2", "2", "n/a", "n/a"],
    status: "active",
    statusLabel: "Активная",
  },
  {
    id: 140007,
    title: "Демо-отчет по медиаматериалам",
    subtitle: "Тестовый сценарий",
    department: "Демо-подразделение №2",
    type: "ДМ2",
    region: "Учебный округ",
    assignee: "Пользователь C-02",
    assigneeMeta: "Сектор B • Уровень 1",
    activityStart: "от 2026-03-26 16:48:31",
    activityEnd: "до 2026-03-27 20:00:00",
    counters: ["1", "n/a", "n/a", "n/a", "n/a", "n/a"],
    status: "active",
    statusLabel: "Активная",
  },
  {
    id: 140006,
    title: "Демонстрационная задача 04",
    subtitle: "Тестовый куратор",
    department: "Учебный уровень",
    type: "ДМ3",
    region: "Региональная",
    assignee: "n/a",
    activityStart: "от 2026-03-26 16:04:08",
    activityEnd: "до 2026-03-27 20:00:00",
    counters: ["6", "n/a", "n/a", "n/a", "n/a", "n/a"],
    status: "pending",
    statusLabel: "В работе",
  },
];
