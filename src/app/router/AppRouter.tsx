import { Routes, Route, BrowserRouter } from 'react-router-dom';
import NewTaskPage from '@pages/newTask/ui/NewTaskPage';
import ProfilePage from '@pages/profile/ui/ProfilePage';
import ReportsPage from '@pages/reports/ui/ReportsPage';
import TasksListPage from '@pages/tasks/ui/TasksListPage';
import StatsPage from '@pages/stats/ui/StatsPage';
import UserProfilePage from '@pages/users/ui/UserProfilePage';
import UsersPage from '@pages/users/ui/UsersPage';
import { MainLayout } from '@app/layouts/layout.tsx';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/tasks" element={<TasksListPage />} />
          <Route path="/tasks/new" element={<NewTaskPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:userId" element={<UserProfilePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Редирект на главную по умолчанию */}
          <Route path="/" element={<StatsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
