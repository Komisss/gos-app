import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, RotateCcw } from 'lucide-react';

import {
  acceptReport,
  federalAcceptReport,
  federalRequestReportRevision,
  getReportReturnReasons,
  requestReportRevision,
} from '@/entities/report/api/reports';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

type Props = {
  reportId: number;
  showAccept?: boolean;
  showRevision?: boolean;
  acceptButtonLabel?: string;
  acceptTitle?: string;
  revisionButtonLabel?: string;
  revisionTitle?: string;
  federalMode?: boolean;
};

export function ReportModerationActions({
  reportId,
  showAccept = true,
  showRevision = true,
  acceptButtonLabel = 'Принять отчет',
  acceptTitle = 'Принять отчет',
  revisionButtonLabel = 'Вернуть на доработку',
  revisionTitle = 'Вернуть на доработку',
  federalMode = false,
}: Props) {
  const queryClient = useQueryClient();
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [acceptComment, setAcceptComment] = useState('');
  const [revisionReasonId, setRevisionReasonId] = useState('');
  const [revisionComment, setRevisionComment] = useState('');
  const [acceptNotifyExecutor, setAcceptNotifyExecutor] = useState(true);
  const [revisionNotifyExecutor, setRevisionNotifyExecutor] = useState(true);
  const [ignoreRevisionLimit, setIgnoreRevisionLimit] = useState(true);

  const reasonsQuery = useQuery({
    queryKey: ['report-return-reasons'],
    queryFn: getReportReturnReasons,
    enabled: revisionOpen,
  });

  const acceptMutation = useMutation({
    mutationFn: () => {
      const payload = {
        comment: acceptComment,
      };

      return federalMode
        ? federalAcceptReport(reportId, { ...payload, notify_executor: acceptNotifyExecutor })
        : acceptReport(reportId, payload);
    },
    onSuccess: async () => {
      setAcceptOpen(false);
      setAcceptComment('');
      setAcceptNotifyExecutor(true);
      await invalidateReportQueries(queryClient, reportId);
    },
  });

  const revisionMutation = useMutation({
    mutationFn: () => {
      const payload = {
        reason_id: Number(revisionReasonId || reasonsQuery.data?.[0]?.id),
        comment: revisionComment,
      };

      return federalMode
        ? federalRequestReportRevision(reportId, {
            ...payload,
            notify_executor: revisionNotifyExecutor,
            ignore_revision_limit: ignoreRevisionLimit,
          })
        : requestReportRevision(reportId, payload);
    },
    onSuccess: async () => {
      setRevisionOpen(false);
      setRevisionReasonId('');
      setRevisionComment('');
      setRevisionNotifyExecutor(true);
      setIgnoreRevisionLimit(true);
      await invalidateReportQueries(queryClient, reportId);
    },
  });

  const reasons = reasonsQuery.data ?? [];
  const selectedReasonId = revisionReasonId || (reasons[0]?.id ? String(reasons[0].id) : '');
  const isRevisionDisabled = revisionMutation.isPending || reasonsQuery.isLoading || !selectedReasonId;

  return (
    <div className="flex flex-wrap gap-2">
      {showAccept && (
        <Popover open={acceptOpen} onOpenChange={setAcceptOpen}>
          <PopoverTrigger asChild>
            <Button type="button" className="bg-emerald-600 text-white hover:bg-emerald-700">
              <CheckCircle />
              {acceptButtonLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[min(420px,calc(100vw-3rem))] p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{acceptTitle}</h3>
                <p className="mt-1 text-xs text-slate-500">Укажите комментарий администратора.</p>
              </div>
              <TextAreaField
                label="Комментарий администратора"
                value={acceptComment}
                onChange={setAcceptComment}
                placeholder="Комментарий"
              />
              {federalMode && (
                <BooleanField
                  label="Уведомить исполнителя"
                  checked={acceptNotifyExecutor}
                  onChange={setAcceptNotifyExecutor}
                />
              )}
              {acceptMutation.isError && <ErrorMessage text="Не удалось принять отчет." />}
              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <Button type="button" variant="outline" onClick={() => setAcceptOpen(false)}>
                  Отмена
                </Button>
                <Button
                  type="button"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={acceptMutation.isPending}
                  onClick={() => acceptMutation.mutate()}
                >
                  {acceptMutation.isPending ? 'Принимаем...' : 'Принять'}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {showRevision && (
        <Popover open={revisionOpen} onOpenChange={setRevisionOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800">
              <RotateCcw />
              {revisionButtonLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[min(460px,calc(100vw-3rem))] p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{revisionTitle}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Выберите причину возврата и добавьте комментарий.
                </p>
              </div>
              <ReasonSelect
                value={selectedReasonId}
                reasons={reasons}
                isLoading={reasonsQuery.isLoading}
                onChange={setRevisionReasonId}
              />
              <TextAreaField
                label="Комментарий администратора"
                value={revisionComment}
                onChange={setRevisionComment}
                placeholder="Что нужно исправить"
              />
              {federalMode && (
                <div className="space-y-2">
                  <BooleanField
                    label="Уведомить исполнителя"
                    checked={revisionNotifyExecutor}
                    onChange={setRevisionNotifyExecutor}
                  />
                  <BooleanField
                    label="Игнорировать лимит исправлений"
                    checked={ignoreRevisionLimit}
                    onChange={setIgnoreRevisionLimit}
                  />
                </div>
              )}
              {reasonsQuery.isError && <ErrorMessage text="Не удалось загрузить причины возврата." />}
              {revisionMutation.isError && <ErrorMessage text="Не удалось вернуть отчет на доработку." />}
              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <Button type="button" variant="outline" onClick={() => setRevisionOpen(false)}>
                  Отмена
                </Button>
                <Button
                  type="button"
                  className="bg-red-600 text-white hover:bg-red-700"
                  disabled={isRevisionDisabled}
                  onClick={() => revisionMutation.mutate()}
                >
                  {revisionMutation.isPending ? 'Отправляем...' : 'Вернуть'}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

function ReasonSelect({
  value,
  reasons,
  isLoading,
  onChange,
}: {
  value: string;
  reasons: Array<{ id: number; code: string; name: string }>;
  isLoading: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">Причина возврата</p>
      <Select value={value} onValueChange={onChange} disabled={isLoading || reasons.length === 0}>
        <SelectTrigger className="w-full border-slate-200 bg-white">
          <SelectValue placeholder={isLoading ? 'Загружаем...' : 'Выберите причину'} />
        </SelectTrigger>
        <SelectContent align="start">
          {reasons.map((reason) => (
            <SelectItem key={reason.id} value={String(reason.id)}>
              {reason.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TextAreaField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 !mb-1">{label}</p>
      <textarea
        className="min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[#465cd3] focus:ring-2 focus:ring-[#465cd3]/15"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function BooleanField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700">
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      {label}
    </label>
  );
}

function ErrorMessage({ text }: { text: string }) {
  return <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">{text}</div>;
}

async function invalidateReportQueries(queryClient: ReturnType<typeof useQueryClient>, reportId: number) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['crm-report', reportId] }),
    queryClient.invalidateQueries({ queryKey: ['crm-reports'] }),
    queryClient.invalidateQueries({ queryKey: ['report-versions'] }),
    queryClient.invalidateQueries({ queryKey: ['report-moderation-actions', reportId] }),
    queryClient.invalidateQueries({ queryKey: ['report-audit-log', reportId] }),
    queryClient.invalidateQueries({ queryKey: ['report-history', reportId] }),
  ]);
}
