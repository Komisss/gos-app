import { useQuery } from '@tanstack/react-query';

import { getReportSummary } from '@/entities/report/api/reports';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { ReportDetailsCard } from './ReportDetailsCard';

type Props = {
  reportId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReportDetailsDialog({ reportId, open, onOpenChange }: Props) {
  const reportQuery = useQuery({
    queryKey: ['crm-report', reportId],
    queryFn: () => getReportSummary(reportId ?? 0),
    enabled: open && Boolean(reportId),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] min-w-0 max-w-[1100px] gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Карточка отчета</DialogTitle>
        <ScrollArea className="max-h-[90vh] w-full min-w-0 max-w-full">
          <div className="min-w-0 max-w-full overflow-hidden p-4 sm:p-6">
            {reportQuery.isLoading ? (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Загружаем отчет...
              </div>
            ) : reportQuery.isError || !reportQuery.data ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
                Не удалось загрузить отчет.
              </div>
            ) : (
              <ReportDetailsCard report={reportQuery.data} showOpenPageLink />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
