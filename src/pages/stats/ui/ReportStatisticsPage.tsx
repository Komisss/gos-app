import { useParams } from 'react-router-dom';

import { ReportsByOrgUnitsStatistics } from '@/widgets/reportStatistics/ui/ReportsByOrgUnitsStatistics';
import { ReportsByRegionsStatistics } from '@/widgets/reportStatistics/ui/ReportsByRegionsStatistics';
import { ReportsByTasksStatistics } from '@/widgets/reportStatistics/ui/ReportsByTasksStatistics';
import { ReportsByUsersStatistics } from '@/widgets/reportStatistics/ui/ReportsByUsersStatistics';
import { ReportsDeadlinesStatistics } from '@/widgets/reportStatistics/ui/ReportsDeadlinesStatistics';
import { ReportsLinkValidationStatistics } from '@/widgets/reportStatistics/ui/ReportsLinkValidationStatistics';
import { ReportsModerationStatistics } from '@/widgets/reportStatistics/ui/ReportsModerationStatistics';
import { ReportsNotCompletedStatistics } from '@/widgets/reportStatistics/ui/ReportsNotCompletedStatistics';
import { ReportsReturnedForRevisionStatistics } from '@/widgets/reportStatistics/ui/ReportsReturnedForRevisionStatistics';

const reportStatisticsTitles: Record<string, string> = {
  'org-units': 'По оргструктуре',
  regions: 'По регионам',
  tasks: 'По задачам',
  executors: 'По исполнителям',
  deadlines: 'По дедлайнам отчетов',
  links: 'По ссылочным отчетам',
  moderation: 'По модерации',
  'not-completed': 'По невыполненным назначениям',
  'revision-requested': 'По возвращенным на доработку',
};

export default function ReportStatisticsPage() {
  const { section = '' } = useParams();
  const title = reportStatisticsTitles[section] ?? 'Статистика отчетов';

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold !text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">Раздел статистики отчетов.</p>
        </div>

        {section === 'org-units' ? (
          <ReportsByOrgUnitsStatistics />
        ) : section === 'regions' ? (
          <ReportsByRegionsStatistics />
        ) : section === 'tasks' ? (
          <ReportsByTasksStatistics />
        ) : section === 'executors' ? (
          <ReportsByUsersStatistics />
        ) : section === 'deadlines' ? (
          <ReportsDeadlinesStatistics />
        ) : section === 'links' ? (
          <ReportsLinkValidationStatistics />
        ) : section === 'moderation' ? (
          <ReportsModerationStatistics />
        ) : section === 'not-completed' ? (
          <ReportsNotCompletedStatistics />
        ) : section === 'revision-requested' ? (
          <ReportsReturnedForRevisionStatistics />
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Виджет для этого среза статистики будет добавлен здесь.
          </div>
        )}
      </div>
    </div>
  );
}
