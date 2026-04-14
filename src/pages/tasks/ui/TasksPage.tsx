// pages/tasks/tasks-page.tsx

import { TaskRegistry } from "@/widgets/taskRegistry/ui/TaskRegistry";
import type {Task} from "@/entities/task/model/types"

const mockTasks: Task[] = [
  {
    id: 140010,
    title: "День возрождения балкарского народа",
    type: "СТ",
    region: "Региональная",
    assignee: "Тобоев Мурат",
    activityStart: "2025-03-27 14:00",
    activityEnd: "2025-03-27 20:00",
    status: "active",
  },
];

export const TasksPage = () => {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Задачи</h1>
      <TaskRegistry tasks={mockTasks} />
    </div>
  );
};
