import { BarChart, Building2, ClipboardList, LayoutDashboard, UserPlus, Users } from 'lucide-react';

export const sidebarSections = [
  {
    title: 'Статистика',
    items: [
      { label: 'Дашборд', icon: LayoutDashboard, href: '/stats/dashboard' },
      { label: 'Отчеты', icon: BarChart, href: '/stats' },
      {
        label: 'Статистика отчетов',
        icon: BarChart,
        items: [
          { label: 'По оргструктуре', href: '/stats/reports/org-units' },
          { label: 'По регионам', href: '/stats/reports/regions' },
          { label: 'По задачам', href: '/stats/reports/tasks' },
          { label: 'По исполнителям', href: '/stats/reports/executors' },
          { label: 'По дедлайнам отчетов', href: '/stats/reports/deadlines' },
          { label: 'По ссылочным отчетам', href: '/stats/reports/links' },
          { label: 'По модерации', href: '/stats/reports/moderation' },
          { label: 'По невыполненным назначениям', href: '/stats/reports/not-completed' },
          { label: 'По возвращенным на доработку', href: '/stats/reports/revision-requested' },
        ],
      },
    ],
  },
  {
    title: 'Задачи',
    items: [
      { label: 'Новая задача', icon: ClipboardList, href: '/tasks/new' },
      { label: 'Список задач', icon: ClipboardList, href: '/tasks' },
    ],
  },
  {
    title: 'Пользователи',
    items: [
      { label: 'Новый пользователь', icon: UserPlus, href: '/users/new' },
      { label: 'Новая оргструктура', icon: Building2, href: '/org-units/new' },
      { label: 'Список пользователей', icon: Users, href: '/users' },
    ],
  },
];
