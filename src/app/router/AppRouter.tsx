import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MainLayout } from '@app/layouts/layout.tsx';
import LoginPage from '@pages/login/ui/LoginPage';
import NewOrgUnitPage from '@pages/newOrgUnit/ui/NewOrgUnitPage';
import NewTaskPage from '@pages/newTask/ui/NewTaskPage';
import NewUserPage from '@pages/newUser/ui/NewUserPage';
import ProfilePage from '@pages/profile/ui/ProfilePage';
import ReportDetailsPage from '@pages/reports/ui/ReportDetailsPage';
import ReportsPage from '@pages/reports/ui/ReportsPage';
import ReportStatisticsPage from '@pages/stats/ui/ReportStatisticsPage';
import StatsPage from '@pages/stats/ui/StatsPage';
import TaskRegionReportsPage from '@pages/stats/ui/TaskRegionReportsPage';
import TaskDetailsPage from '@pages/tasks/ui/TaskDetailsPage';
import TasksListPage from '@pages/tasks/ui/TasksListPage';
import RegionManagersPage from '@pages/users/ui/RegionManagersPage';
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
            <Route path="/stats/dashboard" element={<ReportsPage />} />
            <Route path="/stats/by_region" element={<TaskRegionReportsPage />} />
            <Route path="/stats/reports/:section" element={<ReportStatisticsPage />} />
            <Route path="/reports/:reportId" element={<ReportDetailsPage />} />
            <Route path="/tasks" element={<TasksListPage />} />
            <Route path="/tasks/new" element={<NewTaskPage />} />
            <Route path="/tasks/:taskId" element={<TaskDetailsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/region-managers" element={<RegionManagersPage />} />
            <Route path="/users/new" element={<NewUserPage />} />
            <Route path="/users/:userId" element={<UserProfilePage />} />
            <Route path="/org-units/new" element={<NewOrgUnitPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/" element={<StatsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
