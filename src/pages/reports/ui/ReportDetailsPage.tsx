import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { getReportSummary } from '@/entities/report/api/reports';
import { ReportDetailsCard } from '@/widgets/reportDetails/ui/ReportDetailsCard';

export default function ReportDetailsPage() {
  const { reportId } = useParams();
  const numericReportId = Number(reportId);

  const reportQuery = useQuery({
    queryKey: ['crm-report', numericReportId],
    queryFn: () => getReportSummary(numericReportId),
    enabled: Number.isFinite(numericReportId),
  });

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">
        {reportQuery.isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Загружаем отчет...
          </div>
        ) : reportQuery.isError || !reportQuery.data ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
            Не удалось загрузить отчет.
          </div>
        ) : (
          <ReportDetailsCard report={reportQuery.data} />
        )}
      </div>
    </div>
  );
}
