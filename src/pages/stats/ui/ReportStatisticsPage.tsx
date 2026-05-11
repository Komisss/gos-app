import { useParams } from 'react-router-dom';

const reportStatisticsTitles: Record<string, string> = {
  'org-units': 'По оргструктуре',
  regions: 'По регионам',
  tasks: 'По задачам',
  user: 'По пользователю',
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

        <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Виджет для этого среза статистики будет добавлен здесь.
        </div>
      </div>
    </div>
  );
}
