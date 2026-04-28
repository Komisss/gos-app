import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MainLayout } from '@app/layouts/layout.tsx';
import LoginPage from '@pages/login/ui/LoginPage';
import NewTaskPage from '@pages/newTask/ui/NewTaskPage';
import ProfilePage from '@pages/profile/ui/ProfilePage';
import ReportsPage from '@pages/reports/ui/ReportsPage';
import StatsPage from '@pages/stats/ui/StatsPage';
import TasksListPage from '@pages/tasks/ui/TasksListPage';
import UserProfilePage from '@pages/users/ui/UserProfilePage';
import UsersPage from '@pages/users/ui/UsersPage';
import { ProtectedRoute, PublicOnlyRoute } from '@/features/auth/model/AuthRoutes';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/tasks" element={<TasksListPage />} />
            <Route path="/tasks/new" element={<NewTaskPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/:userId" element={<UserProfilePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/" element={<StatsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
