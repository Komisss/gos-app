import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

import { downloadExportFile, getExportStatus } from '@/entities/export/api/exports';
import type { ExportCreateResponse, ExportStatusResponse } from '@/entities/export/model/types';
import { downloadBlob } from '@/shared/lib/downloadBlob';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';

type Props = {
  exportJob: ExportCreateResponse | null;
  title?: string;
  defaultFileName?: string;
  onClose: () => void;
};

export function AnalyticsExportStatusToast({
  exportJob,
  title = 'Экспорт дашборда',
  defaultFileName = 'analytics-dashboard.xlsx',
  onClose,
}: Props) {
  const downloadedRef = useRef<string | null>(null);
  const statusQuery = useQuery({
    queryKey: ['analytics-export-status', exportJob?.exportId],
    queryFn: () => getExportStatus(exportJob?.exportId ?? ''),
    enabled: Boolean(exportJob?.exportId) && isPendingStatus(exportJob.status),
    refetchInterval: (query) =>
      isPendingStatus(query.state.data?.status ?? exportJob?.status) ? 5000 : false,
  });

  const status = normalizeStatus(exportJob, statusQuery.data);

  useEffect(() => {
    if (!exportJob || status.status !== 'ready' || downloadedRef.current === exportJob.exportId) {
      return;
    }

    downloadedRef.current = exportJob.exportId;
    downloadExportFile(exportJob.exportId).then((blob) => {
      downloadBlob(blob, status.fileName || exportJob.fileName || defaultFileName);
    });
  }, [defaultFileName, exportJob, status.fileName, status.status]);

  if (!exportJob) {
    return null;
  }

  const Icon =
    status.status === 'ready' ? CheckCircle2 : status.status === 'failed' ? XCircle : Loader2;
  const progressValue = status.progressPercent ?? (status.status === 'ready' ? 100 : 0);

  return (
    <div className="fixed right-4 bottom-4 z-50 w-[min(420px,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Icon
            className={`size-5 ${
              status.status === 'ready'
                ? 'text-emerald-600'
                : status.status === 'failed'
                  ? 'text-red-600'
                  : 'animate-spin text-[#465cd3]'
            }`}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <div className="mt-1 text-xs text-slate-500">{getStatusLabel(status.status)}</div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between gap-3 text-xs text-slate-500">
              <span className="truncate">
                {status.fileName || exportJob.fileName || defaultFileName}
              </span>
              <span>{progressValue}%</span>
            </div>
            <Progress value={progressValue} />
          </div>

          {status.errorMessage && (
            <div className="rounded-md bg-red-50 p-2 text-xs text-red-700">
              {status.errorMessage}
            </div>
          )}

          <div className="grid gap-1 text-xs text-slate-500">
            <div>ID: {exportJob.exportId}</div>
            <div>Создан: {formatDateTime(status.createdAt)}</div>
            {status.finishedAt && <div>Завершен: {formatDateTime(status.finishedAt)}</div>}
          </div>

          {(status.status === 'ready' || status.status === 'failed') && (
            <div className="flex justify-end">
              <Button type="button" size="sm" variant="outline" onClick={onClose}>
                Закрыть
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function normalizeStatus(
  exportJob: ExportCreateResponse | null,
  status?: ExportStatusResponse,
): ExportStatusResponse {
  return {
    exportId: status?.exportId ?? exportJob?.exportId ?? '',
    status: status?.status ?? exportJob?.status ?? 'created',
    progressPercent: status?.progressPercent ?? (exportJob?.status === 'ready' ? 100 : 0),
    fileName: status?.fileName ?? exportJob?.fileName ?? '',
    downloadUrl: status?.downloadUrl ?? exportJob?.downloadUrl ?? '',
    createdAt: status?.createdAt ?? exportJob?.createdAt ?? '',
    startedAt: status?.startedAt ?? null,
    finishedAt: status?.finishedAt ?? null,
    errorMessage: status?.errorMessage ?? null,
  };
}

function isPendingStatus(status?: string) {
  return status === 'created' || status === 'processing';
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    created: 'Создан, ожидает обработки',
    processing: 'Файл формируется',
    ready: 'Файл готов, скачивание запущено',
    failed: 'Экспорт завершился ошибкой',
  };

  return labels[status] ?? status;
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
