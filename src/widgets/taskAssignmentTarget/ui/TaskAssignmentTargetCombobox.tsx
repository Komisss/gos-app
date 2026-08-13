import { useEffect, useMemo, useState, type ComponentProps, type UIEvent } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';

import type { OrgUnit } from '@/entities/orgUnit/model/types';
import type { Region } from '@/entities/region/model/types';
import type { TaskPayload, TaskTargetType } from '@/entities/task/model/types';
import { getUsersPage } from '@/entities/user/api/users';
import type { UserListItem } from '@/entities/user/model/types';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

export type AssignmentKind = Exclude<TaskTargetType, 'org_unit'>;

export type AssignmentTarget = {
  kind: AssignmentKind;
  ids: number[];
} | null;

type AssignmentOption = {
  id: number;
  kind: AssignmentKind;
  label: string;
  description?: string;
};

type Props = {
  scope: TaskPayload['scope'];
  regions: Region[];
  orgUnits?: OrgUnit[];
  isLoading: boolean;
  value: AssignmentTarget;
  contentMode?: 'default' | 'dialog';
  onChange: (target: AssignmentTarget) => void;
};

const ASSIGNMENT_USERS_PAGE_SIZE = 50;

export function TaskAssignmentTargetCombobox({
  scope,
  regions,
  orgUnits = [],
  isLoading,
  value,
  contentMode = 'default',
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<AssignmentKind>(value?.kind ?? 'region');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 500);
  const usersQuery = useInfiniteQuery({
    queryKey: ['task-assignment-users', ASSIGNMENT_USERS_PAGE_SIZE, debouncedQuery.trim()],
    queryFn: ({ pageParam }) =>
      getUsersPage(
        { search: debouncedQuery.trim(), statuses: 'active' },
        Number(pageParam),
        ASSIGNMENT_USERS_PAGE_SIZE,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: open && kind === 'user',
  });
  const users = useMemo(
    () => usersQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [usersQuery.data],
  );
  const data = useMemo(
    () => ({ users, regions, orgUnits }),
    [orgUnits, regions, users],
  );
  const selectedLabel = getAssignmentLabel(value, data);
  const selectedNames = getAssignmentNames(value, data);
  const list = useAssignmentList(kind, query, data);
  const listIsLoading = kind === 'user' ? usersQuery.isLoading : isLoading;
  const Content = contentMode === 'dialog' ? DialogPopoverContent : PopoverContent;

  function handleListScroll(event: UIEvent<HTMLDivElement>) {
    if (kind !== 'user' || !usersQuery.hasNextPage || usersQuery.isFetchingNextPage) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;

    if (scrollHeight - scrollTop - clientHeight < 48) {
      void usersQuery.fetchNextPage();
    }
  }

  function handleSelect(item: AssignmentOption) {
    const currentIds = value?.kind === item.kind ? value.ids : [];
    const nextIds = item.kind === 'region' && scope === 'regional'
      ? [item.id]
      : currentIds.includes(item.id)
        ? currentIds.filter((id) => id !== item.id)
        : [...currentIds, item.id];

    onChange(nextIds.length > 0 ? { kind: item.kind, ids: nextIds } : null);

    if (item.kind === 'region' && scope === 'regional') {
      setOpen(false);
    }
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full justify-between border-slate-200 bg-white text-left font-normal"
          >
            <span className="min-w-0 truncate">{selectedLabel}</span>
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <Content align="start" className="w-[min(560px,calc(100vw-3rem))] gap-4 p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Тип адресата</p>
            <Select
              value={kind}
              onValueChange={(nextKind) => {
                const typedKind = nextKind as AssignmentKind;
                setKind(typedKind);
                setQuery('');
                onChange(null);
              }}
            >
              <SelectTrigger className="w-full border-slate-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="region">Региональная</SelectItem>
                <SelectItem value="user">Пользователь</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">{getSearchLabel(kind)}</p>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-9 border-slate-200 pl-9"
                placeholder="Поиск по ФИО или логину"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div
              className="h-64 overflow-y-auto rounded-md border border-slate-200"
              onScroll={handleListScroll}
            >
              <div className="p-1">
                {listIsLoading ? (
                  <div className="px-3 py-8 text-center text-sm text-slate-500">
                    Загружаем список...
                  </div>
                ) : list.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-slate-500">
                    Ничего не найдено.
                  </div>
                ) : (
                  list.map((item) => (
                    <button
                      key={`${item.kind}-${item.id}`}
                      type="button"
                      className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
                      onClick={() => handleSelect(item)}
                    >
                      <Check
                        className={cn(
                          'mt-0.5 size-4 text-[#465cd3]',
                          value?.kind === item.kind && value.ids.includes(item.id)
                            ? 'opacity-100'
                            : 'opacity-0',
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block font-medium text-slate-900">{item.label}</span>
                        {item.description && (
                          <span className="block text-xs text-slate-500">{item.description}</span>
                        )}
                      </span>
                    </button>
                  ))
                )}
                {kind === 'user' && usersQuery.isFetchingNextPage && (
                  <div className="px-3 py-3 text-center text-sm text-slate-500">
                    Загружаем еще...
                  </div>
                )}
              </div>
            </div>
          </div>
        </Content>
      </Popover>
      {selectedNames.length > 0 && (
        <p className="text-sm leading-6 text-slate-600">{selectedNames.join(', ')}</p>
      )}
    </div>
  );
}

function useAssignmentList(
  kind: AssignmentKind,
  query: string,
  data: { users: UserListItem[]; regions: Region[]; orgUnits: OrgUnit[] },
) {
  const normalizedQuery = query.trim().toLowerCase();

  return useMemo(() => {
    const items = getAssignmentOptions(kind, data);

    if (!normalizedQuery || kind === 'user') {
      return items;
    }

    return items.filter((item) =>
      `${item.label} ${item.description ?? ''}`.toLowerCase().includes(normalizedQuery),
    );
  }, [data, kind, normalizedQuery]);
}

function getAssignmentOptions(
  kind: AssignmentKind,
  data: { users: UserListItem[]; regions: Region[]; orgUnits: OrgUnit[] },
): AssignmentOption[] {
  if (kind === 'region') {
    return data.regions.map((region) => ({
      id: region.id,
      kind: 'region',
      label: region.name,
      description: region.code,
    }));
  }

  return data.users
    .filter(isActiveUser)
    .map((user) => ({
      id: user.id,
      kind: 'user',
      label: user.fullName,
      description: [
        user.role?.name ?? 'Роль не указана',
        `@${user.username}`,
        user.region?.name,
      ]
        .filter(Boolean)
        .join(' • '),
    }));
}

function getAssignmentLabel(
  value: AssignmentTarget,
  data: { users: UserListItem[]; regions: Region[]; orgUnits: OrgUnit[] },
) {
  if (!value) {
    return 'Выберите адресата задачи';
  }

  const options = getAssignmentOptions(value.kind, data).filter((item) => value.ids.includes(item.id));

  if (options.length === 1) {
    return options[0].label.trim();
  }

  if (options.length > 1) {
    return `Выбрано: ${options.length}`;
  }

  return 'Выберите адресата задачи';
}

function getAssignmentNames(
  value: AssignmentTarget,
  data: { users: UserListItem[]; regions: Region[]; orgUnits: OrgUnit[] },
) {
  if (!value) {
    return [];
  }

  return getAssignmentOptions(value.kind, data)
    .filter((item) => value.ids.includes(item.id))
    .map((item) => item.label.trim());
}

function getSearchLabel(kind: AssignmentKind) {
  return kind === 'region' ? 'Регион' : 'Пользователь';
}

function isActiveUser(user: UserListItem) {
  return user.status === 'active' || (user.active && !user.status);
}

function useDebouncedValue(value: string, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
}

function DialogPopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Content
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 flex w-72 origin-(--radix-popover-content-transform-origin) flex-col gap-4 rounded-md bg-popover p-4 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
        className,
      )}
      {...props}
    />
  );
}
