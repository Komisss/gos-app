import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, ExternalLink } from 'lucide-react';

import type { ReportDetails } from '@/entities/report/model/types';
import { getReportFormatLabel, getTaskTypeLabel } from '@/entities/task/api/tasks';
import { useAuth } from '@/features/auth/model/AuthContext';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import { ReportHistory } from './ReportHistory';
import { ReportModerationActions } from './ReportModerationActions';

type Props = {
  report: ReportDetails;
  showOpenPageLink?: boolean;
};

export function ReportDetailsCard({ report, showOpenPageLink = false }: Props) {
  const { session } = useAuth();
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const reportPageLink = `/reports/${report.id}`;
  const moderationReportId = report.reportId ?? Number(report.id);
  // report.reportStatus - under_review для обратной совместимости. В будущем, когда under_review не будет, убрать его
  const isFederalAdmin = session?.role?.code === 'federal_manager' || session?.role?.id === 1;
  const isRegionalAdmin = session?.role?.code === 'regional_manager' || session?.role?.id === 2;
  const canUseModerationEndpoint = Number.isFinite(moderationReportId);
  const isPendingReport = report.reportStatus === 'pending' || report.reportStatus === 'under_review';
  const canModeratePendingReport =
    canUseModerationEndpoint && isPendingReport && (isFederalAdmin || isRegionalAdmin);
  const canFederalAcceptReport =
    canUseModerationEndpoint && isFederalAdmin && report.reportStatus === 'revision_requested';
  const canFederalRequestRevision =
    canUseModerationEndpoint && isFederalAdmin && report.reportStatus === 'accepted';

  async function handleCopyReportLink() {
    try {
      setIsCopyingLink(true);
      await navigator.clipboard.writeText(`${window.location.origin}${reportPageLink}`);
    } finally {
      setIsCopyingLink(false);
    }
  }

  return (
    <article className="min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {report.reportStatus ? (
              <StatusBadge value={report.reportStatus} label={getReportStatusLabel(report.reportStatus)} />
            ) : (
              <Badge className="rounded-md border-0 bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                Нет отчета
              </Badge>
            )}
            <span className="text-xs font-medium text-slate-500">Отчет #{report.id}</span>
            <span className="text-xs font-medium text-slate-500">Назначение #{report.assignmentId}</span>
          </div>
          <h1 className="text-2xl font-semibold leading-tight !text-slate-900">{report.taskTitle}</h1>
          <p className="text-sm text-slate-500">
            ID задачи: {report.taskId} • {getTaskScopeLabel(report.taskScope)} • {getTaskTypeLabel(report.taskType)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canModeratePendingReport && <ReportModerationActions reportId={moderationReportId} />}
          {canFederalRequestRevision && (
            <ReportModerationActions
              reportId={moderationReportId}
              showAccept={false}
              federalMode
              revisionButtonLabel="Федерально вернуть на доработку"
              revisionTitle="Федерально вернуть на доработку"
            />
          )}
          {canFederalAcceptReport && (
            <ReportModerationActions
              reportId={moderationReportId}
              showRevision={false}
              federalMode
              acceptButtonLabel="Федерально принять отчет"
              acceptTitle="Федерально принять отчет"
            />
          )}
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="border-slate-200"
            onClick={handleCopyReportLink}
            disabled={isCopyingLink}
            aria-label="Скопировать ссылку на отчет"
          >
            <Copy />
          </Button>
          {showOpenPageLink && (
            <Button asChild variant="outline" className="border-slate-200">
              <Link to={reportPageLink} target="_blank" rel="noreferrer">
                <ExternalLink />
                Открыть страницу
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Separator className="my-5" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoItem label="Исполнитель" value={report.executorName} hint={`${report.executorRole} • ${report.executorStatus}`} />
        <InfoItem label="Регион" value={report.regionName} />
        <InfoItem label="Оргструктура" value={report.orgUnitName} />
        <InfoItem label="Формат" value={getReportFormatLabel(report.requiredReportFormat)} />
        <InfoItem label="Статус назначения" value={getAssignmentStatusLabel(report.assignmentStatus)} />
        <InfoItem label="Версия" value={report.versionNumber ?? 'Не указана'} hint={report.isCurrentVersion ? 'Текущая версия' : 'Не текущая версия'} />
        <InfoItem label="Отправлен" value={formatDateTime(report.submittedAt)} />
        <InfoItem label="Дедлайн" value={formatDateTime(report.deadlineAt)} />
        <InfoItem label="Просрочен" value={report.isOverdue ? 'Да' : 'Нет'} />
      </div>

      <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Содержание отчета</h2>
          {report.reportContent?.displayValue ? (
            <a
              href={report.reportContent.linkUrl ?? report.reportContent.previewUrl ?? report.reportContent.displayValue}
              target="_blank"
              rel="noreferrer"
              className="block break-all text-sm font-medium text-[#465cd3] hover:underline"
            >
              {report.reportContent.displayValue}
            </a>
          ) : (
            <p className="text-sm text-slate-500">Содержание отчета не указано.</p>
          )}
        </section>

        <aside className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-base font-semibold text-slate-900">Доступные действия</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {report.availableActions.length ? (
              report.availableActions.map((action) => (
                <Badge key={action} className="rounded-md border-0 bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {action}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-slate-500">Нет доступных действий.</p>
            )}
          </div>
        </aside>
      </div>

      <ReportHistory reportId={Number(report.id)} reportType={report.reportType} taskAssignmentId={report.assignmentId} />
    </article>
  );
}

function InfoItem({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

function StatusBadge({ value, label }: { value: string; label: string }) {
  const className =
    value === 'accepted'
      ? 'bg-emerald-100 text-emerald-700'
      : value === 'revision_requested' || value === 'not_completed'
        ? 'bg-red-100 text-red-700'
        : value === 'pending' || value === 'under_review'
          ? 'bg-sky-100 text-sky-700'
          : 'bg-slate-200 text-slate-700';

  return <Badge className={`rounded-md border-0 px-2.5 py-1 text-xs font-medium ${className}`}>{label}</Badge>;
}

function getReportStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'Ожидает проверки',
    under_review: 'На проверке',
    accepted: 'Принят',
    revision_requested: 'Нужна доработка',
    not_completed: 'Не выполнен',
  };

  return labels[status] ?? status;
}

function getAssignmentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    assigned: 'Назначено',
    in_progress: 'В работе',
    under_review: 'На проверке',
    revision_requested: 'Нужна доработка',
    accepted: 'Принято',
    not_completed: 'Не выполнено',
  };

  return labels[status] ?? status;
}

function getTaskScopeLabel(scope: string) {
  const labels: Record<string, string> = {
    federal: 'Федеральный',
    regional: 'Региональный',
  };

  return labels[scope] ?? scope;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Не указано';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}
