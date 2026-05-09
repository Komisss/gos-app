import { BarChart, Building2, ClipboardList, UserPlus, Users } from 'lucide-react';

export const sidebarSections = [
  {
    title: 'СТАТИСТИКА',
    items: [{ label: 'Статистика', icon: BarChart, href: '/stats' }],
  },
  {
    title: 'ЗАДАЧИ',
    items: [
      { label: 'Новая задача', icon: ClipboardList, href: '/tasks/new' },
      { label: 'Список задач', icon: ClipboardList, href: '/tasks' },
    ],
  },
  {
    title: 'ПОЛЬЗОВАТЕЛИ',
    items: [
      { label: 'Новый пользователь', icon: UserPlus, href: '/users/new' },
      { label: 'Новая оргструктура', icon: Building2, href: '/org-units/new' },
      { label: 'Список пользователей', icon: Users, href: '/users' },
    ],
  },
];
