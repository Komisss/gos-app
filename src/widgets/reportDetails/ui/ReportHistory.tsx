import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  getModerationActions,
  getReportAuditLog,
  getReportHistory,
  getReportLinkValidation,
  getReportVersions,
} from '@/entities/report/api/reports';
import type {
  AuditLogFilters,
  ModerationActionsFilters,
  ReportHistoryFilters,
  ReportVersionsFilters,
} from '@/entities/report/model/types';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { TableScrollArea } from '@/shared/ui/table-scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';

const actionTypeOptions = ['accept', 'request_revision', 'reject', 'approve', 'return'];
const entityTypeOptions = ['report', 'task_assignment', 'moderation_action', 'link_validation_result', 'bulk_operation'];

export function ReportHistory({ reportId, taskAssignmentId }: { reportId: number; taskAssignmentId: number }) {
  const [versionsFilters, setVersionsFilters] = useState<ReportVersionsFilters>({
    include_content: true,
    include_link_validation: true,
    include_moderation: true,
    sort_direction: 'asc',
  });
  const [moderationFilters, setModerationFilters] = useState<ModerationActionsFilters>({
    action_types: [],
    include_moderator: true,
    include_versions: false,
    moderation_level: '',
    page: 1,
    page_size: 50,
    sort_direction: 'desc',
  });
  const [auditFilters, setAuditFilters] = useState<AuditLogFilters>({
    action_types: [],
    actor_user_ids: [],
    entity_types: [],
    from: '',
    to: '',
    include_payload: false,
    page: 1,
    page_size: 50,
    sort_direction: 'desc',
    sources: '',
  });
  const [historyFilters, setHistoryFilters] = useState<ReportHistoryFilters>({
    event_types: '',
    from: '',
    to: '',
    include_audit: true,
    include_link_validation: true,
    include_versions: true,
    page: 1,
    page_size: 50,
  });

  const versionsQuery = useQuery({
    queryKey: ['report-versions', taskAssignmentId, versionsFilters],
    queryFn: () => getReportVersions(taskAssignmentId, versionsFilters),
  });

  const moderationQuery = useQuery({
    queryKey: ['report-moderation-actions', reportId, moderationFilters],
    queryFn: () => getModerationActions(reportId, moderationFilters),
  });

  const auditQuery = useQuery({
    queryKey: ['report-audit-log', reportId, auditFilters],
    queryFn: () => getReportAuditLog(reportId, auditFilters),
  });

  const historyQuery = useQuery({
    queryKey: ['report-history', reportId, historyFilters],
    queryFn: () => getReportHistory(reportId, historyFilters),
  });

  const linkValidationQuery = useQuery({
    queryKey: ['report-link-validation', reportId],
    queryFn: () => getReportLinkValidation(reportId),
  });

  return (
    <TooltipProvider>
      <section className="mt-6 min-w-0 max-w-full space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">История отчета</h2>
          <p className="mt-1 text-sm text-slate-500">
            Версии, модерация, аудит, автопроверка ссылки и готовый timeline.
          </p>
        </div>

        <HistoryBlock title="Все версии отчетов по назначению">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 items-end">
            <BooleanFilter label="Краткое содержание" checked={versionsFilters.include_content} onChange={(include_content) => setVersionsFilters((current) => ({ ...current, include_content }))} />
            <BooleanFilter label="Автопроверка ссылки" checked={versionsFilters.include_link_validation} onChange={(include_link_validation) => setVersionsFilters((current) => ({ ...current, include_link_validation }))} />
            <BooleanFilter label="Последняя модерация" checked={versionsFilters.include_moderation} onChange={(include_moderation) => setVersionsFilters((current) => ({ ...current, include_moderation }))} />
            <SortSelect value={versionsFilters.sort_direction} onChange={(sort_direction) => setVersionsFilters((current) => ({ ...current, sort_direction }))} />
          </div>

          <TableScrollArea className="w-full max-w-full" headerHeight="3rem" height="22rem">
            <Table className="min-w-[1100px] whitespace-nowrap">
              <TableHeader>
                <TableRow className="border-b-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead>Версия</TableHead>
                  <TableHead>Отчет</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Отправил</TableHead>
                  <TableHead>Отправлен</TableHead>
                  <TableHead>Содержание</TableHead>
                  <TableHead>Проверка ссылки</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(versionsQuery.data?.versions ?? []).map((version, index) => (
                  <TableRow key={version.report_id} className={getHistoryRowClassName(index)}>
                    <TableCell>#{version.version_number}{version.is_current_version ? ' текущая' : ''}</TableCell>
                    <TableCell>{version.report_id}</TableCell>
                    <TableCell>{version.report_status}</TableCell>
                    <TableCell>{version.submitted_by_user_id}</TableCell>
                    <TableCell>{formatDateTime(version.submitted_at)}</TableCell>
                    <TruncatedCell value={version.content?.display_value ?? 'n/a'} />
                    <TruncatedCell value={version.link_validation ? `${version.link_validation.http_status}, ${version.link_validation.system_comment}` : 'n/a'} maxWidthClassName="max-w-[320px]" />
                  </TableRow>
                ))}
                {versionsQuery.data?.versions.length === 0 && <EmptyRow colSpan={7} />}
              </TableBody>
            </Table>
          </TableScrollArea>
        </HistoryBlock>

        <HistoryBlock title="Действия модерации">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5 items-end">
            <MultiSelect label="Типы действий" values={moderationFilters.action_types} options={actionTypeOptions} onChange={(action_types) => setModerationFilters((current) => ({ ...current, action_types, page: 1 }))} />
            <BooleanFilter label="ФИО модератора" checked={moderationFilters.include_moderator} onChange={(include_moderator) => setModerationFilters((current) => ({ ...current, include_moderator }))} />
            <BooleanFilter label="Все версии назначения" checked={moderationFilters.include_versions} onChange={(include_versions) => setModerationFilters((current) => ({ ...current, include_versions }))} />
            <FilterSelect label="Уровень" value={moderationFilters.moderation_level || 'all'} options={[{ value: 'all', label: 'Все' }, { value: 'federal', label: 'Федеральный' }, { value: 'regional', label: 'Региональный' }]} onChange={(moderation_level) => setModerationFilters((current) => ({ ...current, moderation_level: moderation_level === 'all' ? '' : moderation_level, page: 1 }))} />
            <SortSelect value={moderationFilters.sort_direction} onChange={(sort_direction) => setModerationFilters((current) => ({ ...current, sort_direction }))} />
          </div>
          <Pagination page={moderationFilters.page} pageSize={moderationFilters.page_size} hasMore={moderationQuery.data?.has_more} onChange={(page) => setModerationFilters((current) => ({ ...current, page }))} onPageSizeChange={(page_size) => setModerationFilters((current) => ({ ...current, page_size, page: 1 }))} />
          <TableScrollArea className="w-full max-w-full" headerHeight="3rem" height="22rem">
            <Table className="min-w-[1100px] whitespace-nowrap">
              <TableHeader>
                <TableRow className="border-b-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead>#</TableHead>
                  <TableHead>Действие</TableHead>
                  <TableHead>Уровень</TableHead>
                  <TableHead>Модератор</TableHead>
                  <TableHead>Причина</TableHead>
                  <TableHead>Комментарий</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(moderationQuery.data?.items ?? []).map((item, index) => (
                  <TableRow key={item.moderation_action_id} className={getHistoryRowClassName(index)}>
                    <TableCell>{item.moderation_action_id}</TableCell>
                    <TableCell>{item.action_type}</TableCell>
                    <TableCell>{item.moderation_level}</TableCell>
                    <TruncatedCell value={item.moderator_full_name} />
                    <TruncatedCell value={item.reason_name ?? 'n/a'} />
                    <TruncatedCell value={item.comment ?? 'n/a'} maxWidthClassName="max-w-[320px]" />
                    <TableCell>{formatDateTime(item.created_at)}</TableCell>
                  </TableRow>
                ))}
                {moderationQuery.data?.items.length === 0 && <EmptyRow colSpan={7} />}
              </TableBody>
            </Table>
          </TableScrollArea>
        </HistoryBlock>

        <HistoryBlock title="Результат проверки ссылки">
          {linkValidationQuery.isLoading ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Загружаем результат проверки ссылки...
            </div>
          ) : linkValidationQuery.isError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Не удалось загрузить результат проверки ссылки.
            </div>
          ) : linkValidationQuery.data ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="font-medium text-slate-900">Отчет #{linkValidationQuery.data.report_id}</div>
              <div className="mt-2">Тип отчета: {linkValidationQuery.data.report_type}</div>
              <div className="break-all">Ссылка: {linkValidationQuery.data.link_url ?? 'n/a'}</div>
              {linkValidationQuery.data.link_validation_result ? (
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3 items-end">
                  <ValidationField label="Домен" value={linkValidationQuery.data.link_validation_result.domain} />
                  <ValidationField label="Статус" value={linkValidationQuery.data.link_validation_result.validation_status} />
                  <ValidationField label="HTTP" value={linkValidationQuery.data.link_validation_result.http_status} />
                  <ValidationField label="Разрешенный домен" value={linkValidationQuery.data.link_validation_result.is_allowed_domain ? 'Да' : 'Нет'} />
                  <ValidationField label="Доступна" value={linkValidationQuery.data.link_validation_result.is_reachable ? 'Да' : 'Нет'} />
                  <ValidationField label="Проверена" value={formatDateTime(linkValidationQuery.data.link_validation_result.checked_at)} />
                  <div className="md:col-span-2 xl:col-span-3">
                    <p className="text-xs font-medium text-slate-500">Комментарий</p>
                    <TruncatedText value={linkValidationQuery.data.link_validation_result.system_comment} maxWidthClassName="max-w-full" />
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-slate-500">Результат проверки отсутствует.</div>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Результат проверки отсутствует.
            </div>
          )}
        </HistoryBlock>

        <HistoryBlock title="Аудит отчета">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5 items-end">
            <MultiSelect label="Типы действий" values={auditFilters.action_types} options={actionTypeOptions} onChange={(action_types) => setAuditFilters((current) => ({ ...current, action_types, page: 1 }))} />
            <NumberListInput label="Инициаторы" values={auditFilters.actor_user_ids} onChange={(actor_user_ids) => setAuditFilters((current) => ({ ...current, actor_user_ids, page: 1 }))} />
            <MultiSelect label="Сущности" values={auditFilters.entity_types} options={entityTypeOptions} onChange={(entity_types) => setAuditFilters((current) => ({ ...current, entity_types, page: 1 }))} />
            <DateFilter label="Событие с" value={auditFilters.from} onChange={(from) => setAuditFilters((current) => ({ ...current, from, page: 1 }))} />
            <DateFilter label="Событие по" value={auditFilters.to} onChange={(to) => setAuditFilters((current) => ({ ...current, to, page: 1 }))} />
            <BooleanFilter label="Payload" checked={auditFilters.include_payload} onChange={(include_payload) => setAuditFilters((current) => ({ ...current, include_payload }))} />
            <SortSelect value={auditFilters.sort_direction} onChange={(sort_direction) => setAuditFilters((current) => ({ ...current, sort_direction }))} />
            <TextFilter label="Источники" value={auditFilters.sources} onChange={(sources) => setAuditFilters((current) => ({ ...current, sources, page: 1 }))} />
          </div>
          <Pagination page={auditFilters.page} pageSize={auditFilters.page_size} hasMore={auditQuery.data?.has_more} onChange={(page) => setAuditFilters((current) => ({ ...current, page }))} onPageSizeChange={(page_size) => setAuditFilters((current) => ({ ...current, page_size, page: 1 }))} />
          <TableScrollArea className="w-full max-w-full" headerHeight="3rem" height="22rem">
            <Table className="min-w-[1200px] whitespace-nowrap">
              <TableHeader>
                <TableRow className="border-b-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead>#</TableHead>
                  <TableHead>Актор</TableHead>
                  <TableHead>Сущность</TableHead>
                  <TableHead>Действие</TableHead>
                  <TableHead>Источник</TableHead>
                  <TableHead>Детали</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(auditQuery.data?.items ?? []).map((item, index) => (
                  <TableRow key={item.audit_log_id} className={getHistoryRowClassName(index)}>
                    <TableCell>{item.audit_log_id}</TableCell>
                    <TruncatedCell value={item.actor_full_name} />
                    <TruncatedCell value={`${item.entity_type} #${item.entity_id}`} />
                    <TableCell>{item.action_type}</TableCell>
                    <TruncatedCell value={item.source} />
                    <TruncatedCell value={item.details ?? 'n/a'} maxWidthClassName="max-w-[340px]" />
                    <TableCell>{formatDateTime(item.created_at)}</TableCell>
                  </TableRow>
                ))}
                {auditQuery.data?.items.length === 0 && <EmptyRow colSpan={7} />}
              </TableBody>
            </Table>
          </TableScrollArea>
        </HistoryBlock>

        <HistoryBlock title="Готовый таймлайн истории">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5 items-end">
            <TextFilter label="Типы событий" value={historyFilters.event_types} onChange={(event_types) => setHistoryFilters((current) => ({ ...current, event_types, page: 1 }))} />
            <DateFilter label="Событие с" value={historyFilters.from} onChange={(from) => setHistoryFilters((current) => ({ ...current, from, page: 1 }))} />
            <DateFilter label="Событие по" value={historyFilters.to} onChange={(to) => setHistoryFilters((current) => ({ ...current, to, page: 1 }))} />
            <BooleanFilter label="AuditLog" checked={historyFilters.include_audit} onChange={(include_audit) => setHistoryFilters((current) => ({ ...current, include_audit }))} />
            <BooleanFilter label="Автопроверка" checked={historyFilters.include_link_validation} onChange={(include_link_validation) => setHistoryFilters((current) => ({ ...current, include_link_validation }))} />
            <BooleanFilter label="Другие версии" checked={historyFilters.include_versions} onChange={(include_versions) => setHistoryFilters((current) => ({ ...current, include_versions }))} />
          </div>
          <Pagination page={historyFilters.page} pageSize={historyFilters.page_size} hasMore={historyQuery.data?.has_more} onChange={(page) => setHistoryFilters((current) => ({ ...current, page }))} onPageSizeChange={(page_size) => setHistoryFilters((current) => ({ ...current, page_size, page: 1 }))} />
          <TableScrollArea className="w-full max-w-full" headerHeight="3rem" height="22rem">
            <Table className="min-w-[1200px] whitespace-nowrap">
              <TableHeader>
                <TableRow className="border-b-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead>Событие</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Актор</TableHead>
                  <TableHead>Версия</TableHead>
                  <TableHead>Источник</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(historyQuery.data?.items ?? []).map((item, index) => (
                  <TableRow key={item.event_id} className={getHistoryRowClassName(index)}>
                    <TableCell>
                      <TruncatedText value={item.event_title} maxWidthClassName="max-w-[240px]" />
                      <div className="text-xs text-slate-500">{item.event_type}</div>
                    </TableCell>
                    <TruncatedCell value={item.event_description} maxWidthClassName="max-w-[360px]" />
                    <TruncatedCell value={item.actor?.full_name ?? 'Система'} />
                    <TableCell>{item.version_number ?? 'n/a'}</TableCell>
                    <TruncatedCell value={`${item.source_entity_type} #${item.source_entity_id}`} />
                    <TableCell>{formatDateTime(item.event_at)}</TableCell>
                  </TableRow>
                ))}
                {historyQuery.data?.items.length === 0 && <EmptyRow colSpan={6} />}
              </TableBody>
            </Table>
          </TableScrollArea>
        </HistoryBlock>
      </section>
    </TooltipProvider>
  );
}

function HistoryBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="min-w-0 max-w-full space-y-4 overflow-hidden rounded-lg border border-slate-200 bg-white p-4"><h3 className="text-base font-semibold text-slate-900">{title}</h3>{children}</div>;
}

function BooleanFilter({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"><Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} />{label}</label>;
}

function SortSelect({ value, onChange }: { value: 'asc' | 'desc'; onChange: (value: 'asc' | 'desc') => void }) {
  return <FilterSelect label="Сортировка" value={value} options={[{ value: 'asc', label: 'По возрастанию' }, { value: 'desc', label: 'По убыванию' }]} onChange={(next) => onChange(next as 'asc' | 'desc')} />;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return <div className="space-y-1"><p className="text-xs font-medium text-slate-500 !mb-1">{label}</p><Select value={value} onValueChange={onChange}><SelectTrigger className="h-9 border-slate-200 bg-white"><SelectValue /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>;
}

function MultiSelect({ label, values, options, onChange }: { label: string; values: string[]; options: string[]; onChange: (values: string[]) => void }) {
  return <div className="space-y-1"><p className="text-xs font-medium text-slate-500 !mb-1">{label}</p><div className="flex min-h-9 flex-wrap gap-2 rounded-md border border-slate-200 bg-white p-2">{options.map((option) => <label key={option} className="flex items-center gap-1 text-xs text-slate-700"><Checkbox checked={values.includes(option)} onCheckedChange={(checked) => onChange(checked === true ? [...values, option] : values.filter((value) => value !== option))} />{option}</label>)}</div></div>;
}

function DateFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div className="space-y-1"><p className="text-xs font-medium text-slate-500 !mb-1">{label}</p><DateTimePicker value={value} onChange={onChange} placeholder="Дата и время" /></div>;
}

function TextFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div className="space-y-1"><p className="text-xs font-medium text-slate-500 !mb-1">{label}</p><Input className="h-9 border-slate-200" value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

function NumberListInput({ label, values, onChange }: { label: string; values: number[]; onChange: (values: number[]) => void }) {
  return <TextFilter label={label} value={values.join(',')} onChange={(value) => onChange(value.split(',').map(Number).filter(Number.isFinite))} />;
}

function Pagination({ page, pageSize, hasMore, onChange, onPageSizeChange }: { page: number; pageSize: number; hasMore?: boolean; onChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Button type="button" variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>Назад</Button><span className="text-sm text-slate-500">Страница {page}</span><Button type="button" variant="outline" disabled={!hasMore} onClick={() => onChange(page + 1)}>Вперед</Button></div><Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Math.min(Number(value), 100))}><SelectTrigger className="h-9 w-24 border-slate-200 bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem><SelectItem value="100">100</SelectItem></SelectContent></Select></div>;
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return <TableRow><TableCell colSpan={colSpan} className="py-8 text-center text-sm text-slate-500">Нет данных.</TableCell></TableRow>;
}

function ValidationField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

function getHistoryRowClassName(index: number) {
  return `align-top border-b-slate-200 hover:bg-slate-50/60 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-100'}`;
}

function TruncatedCell({
  value,
  maxWidthClassName = 'max-w-[240px]',
}: {
  value: React.ReactNode;
  maxWidthClassName?: string;
}) {
  return (
    <TableCell className={maxWidthClassName}>
      <TruncatedText value={value} maxWidthClassName={maxWidthClassName} />
    </TableCell>
  );
}

function TruncatedText({
  value,
  maxWidthClassName = 'max-w-[240px]',
}: {
  value: React.ReactNode;
  maxWidthClassName?: string;
}) {
  const text = String(value ?? '');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`block truncate ${maxWidthClassName}`}>{value}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[520px] whitespace-normal break-words">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return 'n/a';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}
