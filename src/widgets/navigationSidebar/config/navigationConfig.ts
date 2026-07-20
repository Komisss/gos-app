import { BarChart, ClipboardList, LayoutDashboard, UserPlus, Users } from 'lucide-react';
import { USER_ROLE_IDS } from '@/entities/user/model/roleOptions';

export const sidebarSections = [
  {
    title: 'Статистика',
    items: [
      { label: 'Дашборд', icon: LayoutDashboard, href: '/stats/dashboard' },
      // { label: 'Отчеты', icon: BarChart, href: '/stats' },
      // {
      //   label: 'Статистика отчетов',
      //   icon: BarChart,
      //   items: [
      //     { label: 'По структуре подчинения', href: '/stats/reports/org-units' },
      //     { label: 'По регионам', href: '/stats/reports/regions' },
      //     { label: 'По задачам', href: '/stats/reports/tasks' },
      //     { label: 'По исполнителям', href: '/stats/reports/executors' },
      //     { label: 'По дедлайнам отчетов', href: '/stats/reports/deadlines' },
      //     { label: 'По ссылочным отчетам', href: '/stats/reports/links' },
      //     { label: 'По модерации', href: '/stats/reports/moderation' },
      //     { label: 'По невыполненным назначениям', href: '/stats/reports/not-completed' },
      //     { label: 'По возвращенным на доработку', href: '/stats/reports/revision-requested' },
      //   ],
      // },
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
      // { label: 'Новая структура подчинения', icon: Building2, href: '/org-units/new' },
      { label: 'Список пользователей', icon: Users, href: '/users' },
      { label: 'Регионы с управляющими', icon: Users, href: '/users/region-managers', roleIds: [USER_ROLE_IDS.federalManager] },
    ],
  },
];
