import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, RotateCcw } from 'lucide-react';

import {
  bulkAcceptReports,
  bulkRequestReportRevision,
  getReportReturnReasons,
} from '@/entities/report/api/reports';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

type Props = {
  reportIds: number[];
  disabled?: boolean;
  onCompleted: () => void;
  onClearSelection: () => void;
};

export function ReportBulkActions({
  reportIds,
  disabled = false,
  onCompleted,
  onClearSelection,
}: Props) {
  const queryClient = useQueryClient();
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [acceptComment, setAcceptComment] = useState('');
  const [acceptExpectedStatus, setAcceptExpectedStatus] = useState('');
  const [acceptSkipInvalid, setAcceptSkipInvalid] = useState(true);
  const [revisionReasonId, setRevisionReasonId] = useState('');
  const [revisionComment, setRevisionComment] = useState('');
  const [revisionExpectedStatus, setRevisionExpectedStatus] = useState('');
  const [revisionSkipInvalid, setRevisionSkipInvalid] = useState(true);

  const reasonsQuery = useQuery({
    queryKey: ['report-return-reasons'],
    queryFn: getReportReturnReasons,
    enabled: revisionOpen,
  });

  const acceptMutation = useMutation({
    mutationFn: () =>
      bulkAcceptReports({
        report_ids: reportIds,
        comment: acceptComment,
        expected_status: normalizeOptionalText(acceptExpectedStatus),
        skip_invalid: acceptSkipInvalid,
      }),
    onSuccess: async () => {
      setAcceptOpen(false);
      setAcceptComment('');
      setAcceptExpectedStatus('');
      setAcceptSkipInvalid(true);
      await queryClient.invalidateQueries({ queryKey: ['crm-reports'] });
      onCompleted();
    },
  });

  const revisionMutation = useMutation({
    mutationFn: () =>
      bulkRequestReportRevision({
        report_ids: reportIds,
        reason_id: Number(revisionReasonId || reasonsQuery.data?.[0]?.id),
        comment: revisionComment,
        expected_status: normalizeOptionalText(revisionExpectedStatus),
        skip_invalid: revisionSkipInvalid,
      }),
    onSuccess: async () => {
      setRevisionOpen(false);
      setRevisionReasonId('');
      setRevisionComment('');
      setRevisionExpectedStatus('');
      setRevisionSkipInvalid(true);
      await queryClient.invalidateQueries({ queryKey: ['crm-reports'] });
      onCompleted();
    },
  });

  const reasons = reasonsQuery.data ?? [];
  const selectedReasonId = revisionReasonId || (reasons[0]?.id ? String(reasons[0].id) : '');
  const isPending = acceptMutation.isPending || revisionMutation.isPending;
  const isDisabled = disabled || reportIds.length === 0 || isPending;
  const isRevisionDisabled = isDisabled || reasonsQuery.isLoading || !selectedReasonId;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="text-sm text-slate-600">
        Выбрано отчетов: <span className="font-semibold text-slate-900">{reportIds.length}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={isPending} onClick={onClearSelection}>
          Снять выбор
        </Button>

        <Popover open={acceptOpen} onOpenChange={setAcceptOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={isDisabled}
            >
              <CheckCircle />
              Принять выбранные
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[min(440px,calc(100vw-3rem))] p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Массовое принятие отчетов</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Будет отправлено отчетов: {reportIds.length}.
                </p>
              </div>
              <TextAreaField
                label="Комментарий администратора"
                value={acceptComment}
                onChange={setAcceptComment}
                placeholder="Комментарий"
              />
              <TextField
                label="Ожидаемый статус"
                value={acceptExpectedStatus}
                onChange={setAcceptExpectedStatus}
                placeholder="Необязательно"
              />
              <BooleanField
                label="Пропускать некорректные отчеты"
                checked={acceptSkipInvalid}
                onChange={setAcceptSkipInvalid}
              />
              {acceptMutation.isError && <ErrorMessage text="Не удалось массово принять отчеты." />}
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

        <Popover open={revisionOpen} onOpenChange={setRevisionOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              disabled={isDisabled}
            >
              <RotateCcw />
              Вернуть выбранные
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[min(460px,calc(100vw-3rem))] p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Массовый возврат на доработку
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Будет отправлено отчетов: {reportIds.length}.
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
              <TextField
                label="Ожидаемый статус"
                value={revisionExpectedStatus}
                onChange={setRevisionExpectedStatus}
                placeholder="Необязательно"
              />
              <BooleanField
                label="Пропускать некорректные отчеты"
                checked={revisionSkipInvalid}
                onChange={setRevisionSkipInvalid}
              />
              {reasonsQuery.isError && (
                <ErrorMessage text="Не удалось загрузить причины возврата." />
              )}
              {revisionMutation.isError && (
                <ErrorMessage text="Не удалось массово вернуть отчеты на доработку." />
              )}
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
      </div>
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

function TextField({
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
      <Input
        className="h-9 border-slate-200 text-sm"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
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
    <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      {label}
    </label>
  );
}

function ErrorMessage({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
      {text}
    </div>
  );
}

function normalizeOptionalText(value: string) {
  const normalizedValue = value.trim();
  return normalizedValue ? normalizedValue : null;
}
