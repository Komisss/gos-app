import { ReportsDashboard } from "@/widgets/reports/ui/ReportsDashboard";
import { Navigate } from 'react-router-dom';
import { useCurrentUserRegion } from '@/features/auth/model/useCurrentUserRegion';

export default function ReportsPage() {
  const { isRegionalManager, regionId, isLoading } = useCurrentUserRegion();

  if (isRegionalManager && isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50 text-sm text-slate-500">
        Загружаем данные региона...
      </div>
    );
  }

  if (isRegionalManager && regionId) {
    return <Navigate to={`/stats/dashboard/region/${regionId}`} replace />;
  }

  return <ReportsDashboard />;
}
