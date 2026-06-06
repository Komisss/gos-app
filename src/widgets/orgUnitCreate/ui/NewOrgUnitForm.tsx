import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createOrgUnit, getOrgUnitsTree } from '@/entities/orgUnit/api/orgUnits';
import type { CreateOrgUnitPayload, OrgUnitType } from '@/entities/orgUnit/model/types';
import { getRegions } from '@/entities/region/api/regions';
import { getUsers } from '@/entities/user/api/users';
import { Button } from '@/shared/ui/button';
import { FilterSearchSelect } from '@/shared/ui/filter-search-select';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

type FormState = {
  region_id: string;
  type: OrgUnitType;
  name: string;
  parent_id: string;
  head_user_id: string;
  is_active: 'true' | 'false';
};

const initialForm: FormState = {
  region_id: '',
  type: 'main_branch',
  name: '',
  parent_id: '',
  head_user_id: '',
  is_active: 'true',
};

export function NewOrgUnitForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(initialForm);

  const regionsQuery = useQuery({
    queryKey: ['regions'],
    queryFn: getRegions,
  });

  const orgUnitsQuery = useQuery({
    queryKey: ['org-units-tree'],
    queryFn: getOrgUnitsTree,
  });

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  });
  const headUserOptions = useMemo(() => {
    const headRoleCode = getHeadRoleCodeForOrgUnitType(form.type);

    return (usersQuery.data ?? [])
      .filter((user) => user.role?.code === headRoleCode)
      .map((user) => ({
        value: String(user.id),
        label: user.fullName,
        labelMeta: user.role?.name,
        description: user.username || 'Не указан',
      }));
  }, [form.type, usersQuery.data]);
  const parentHeadRoleId = getParentHeadRoleId(form.type);
  const parentOrgUnitOptions = useMemo(() => {
    if (!form.region_id) {
      return [];
    }

    const regionId = Number(form.region_id);

    return (orgUnitsQuery.data ?? []).filter(
      (orgUnit) =>
        orgUnit.regionId === regionId &&
        orgUnit.headUser?.role?.role_id === parentHeadRoleId,
    );
  }, [form.region_id, orgUnitsQuery.data, parentHeadRoleId]);

  const createMutation = useMutation({
    mutationFn: createOrgUnit,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['org-units-tree'] });
      navigate('/users');
    },
  });

  useEffect(() => {
    if (form.head_user_id && !headUserOptions.some((user) => user.value === form.head_user_id)) {
      setForm((current) => ({ ...current, head_user_id: '' }));
    }
  }, [form.head_user_id, headUserOptions]);

  useEffect(() => {
    if (form.parent_id && !parentOrgUnitOptions.some((orgUnit) => String(orgUnit.id) === form.parent_id)) {
      setForm((current) => ({ ...current, parent_id: '' }));
    }
  }, [form.parent_id, parentOrgUnitOptions]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate(toPayload(form));
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-6 py-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold !text-slate-900">Новая структура подчинения</h1>
          <p className="text-sm text-slate-500">
            Заполните данные подразделения и его связь с регионом, родителем и руководителем.
          </p>
        </div>

        <form
          className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <Field label="Название структуры подчинения">
            <Input
              className="border-slate-200"
              placeholder="Введите название"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Регион">
              <FilterSearchSelect
                value={form.region_id}
                placeholder="Выберите регион"
                searchPlaceholder="Поиск региона"
                options={(regionsQuery.data ?? []).map((region) => ({
                  value: String(region.id),
                  label: region.name,
                  description: region.code,
                }))}
                onChange={(region_id) => setForm((current) => ({ ...current, region_id }))}
              />
            </Field>

            <Field label="Тип">
              <Select
                value={form.type}
                onValueChange={(type) => setForm((current) => ({ ...current, type: type as OrgUnitType }))}
              >
                <SelectTrigger className="w-full border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="main_branch">Б3</SelectItem>
                  <SelectItem value="unit">Б2</SelectItem>
                  <SelectItem value="department">Б1</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Родительская структура подчинения">
              <FilterSearchSelect
                value={form.parent_id}
                placeholder={getParentOrgUnitPlaceholder(form.type, form.region_id)}
                searchPlaceholder="Поиск структуры подчинения"
                disabled={!form.region_id}
                options={parentOrgUnitOptions.map((orgUnit) => ({
                  value: String(orgUnit.id),
                  label: `${'  '.repeat(orgUnit.depth)}${orgUnit.name}`,
                  description: orgUnit.regionName ?? undefined,
                }))}
                onChange={(parent_id) => setForm((current) => ({ ...current, parent_id }))}
              />
            </Field>

            <Field label="Руководитель">
              <FilterSearchSelect
                value={form.head_user_id}
                placeholder="Без руководителя"
                searchPlaceholder="Поиск пользователя"
                options={headUserOptions}
                onChange={(head_user_id) => setForm((current) => ({ ...current, head_user_id }))}
              />
            </Field>
          </div>

          <Field label="Статус">
            <Select
              value={form.is_active}
              onValueChange={(is_active) =>
                setForm((current) => ({ ...current, is_active: is_active as 'true' | 'false' }))
              }
            >
              <SelectTrigger className="w-full border-slate-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="true">Активная</SelectItem>
                <SelectItem value="false">Неактивная</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {createMutation.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Не удалось создать структуру подчинения.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <Button asChild variant="outline" className="border-slate-200">
              <Link to="/users">К списку пользователей</Link>
            </Button>
            <Button
              className="bg-[#465cd3] text-white hover:bg-[#3c50bd]"
              disabled={createMutation.isPending || !form.region_id}
            >
              {createMutation.isPending ? 'Создание...' : 'Создать структуру подчинения'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getHeadRoleCodeForOrgUnitType(type: OrgUnitType) {
  if (type === 'main_branch') {
    return 'main_manager';
  }

  if (type === 'unit') {
    return 'unit_head';
  }

  return 'department_head';
}

function getParentHeadRoleId(type: OrgUnitType) {
  if (type === 'department') {
    return 6;
  }

  if (type === 'unit') {
    return 4;
  }

  return 2;
}

function getParentOrgUnitPlaceholder(type: OrgUnitType, regionId: string) {
  if (!regionId) {
    return 'Сначала выберите регион';
  }

  if (type === 'main_branch') {
    return 'Выберите структуру регионального руководителя';
  }

  return type === 'unit'
    ? 'Выберите родительскую структуру Б3'
    : 'Выберите родительскую структуру Б2';
}

function toPayload(form: FormState): CreateOrgUnitPayload {
  return {
    region_id: Number(form.region_id),
    type: form.type,
    name: form.name.trim(),
    parent_id: form.parent_id ? Number(form.parent_id) : 0,
    head_user_id: form.head_user_id ? Number(form.head_user_id) : 0,
    is_active: form.is_active === 'true',
  };
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 !mb-1">{label}</p>
      {children}
    </div>
  );
}
