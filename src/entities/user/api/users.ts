import { http } from '@/shared/api/http';
import { toApiDateTime } from '@/shared/lib/dateTime';
import type {
  UserDetails,
  UserDetailsDto,
  UserListDto,
  UserListItem,
  RegisterUserPayload,
  UserPatchPayload,
} from '@/entities/user/model/types';

const USERS_ENDPOINT = '/api/v1/users';
const USERS_EXPORT_ENDPOINT = '/api/v1/users/export';
const USERS_IMPORT_ENDPOINT = '/api/v1/users/import';
const REGISTER_ENDPOINT = '/api/v1/auth/register';

export type UserFilters = Partial<{
  created_from: string;
  created_to: string;
  org_unit: string;
  region: string;
  role: string;
  search: string;
  status: string;
  page: string;
  page_size: string;
}>;

export type UsersPage = {
  items: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type UsersImportResult = {
  created: number;
  updated: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
};

type UsersResponse =
  | UserListDto[]
  | {
      results?: UserListDto[];
      items?: UserListDto[];
      data?: UserListDto[];
    };

type UsersPageResponse = {
  items?: UserListDto[];
  total?: number;
  page?: number;
  page_size?: number;
  has_more?: boolean;
};

export async function getUsers(filters: UserFilters = {}) {
  const response = await http<UsersResponse>(`${USERS_ENDPOINT}${buildQueryString(filters)}`);

  return normalizeUsersResponse(response).map(mapUserListDto);
}

export async function getUsersPage(filters: UserFilters = {}, page = 1, pageSize = 25): Promise<UsersPage> {
  const response = await http<UsersPageResponse>(
    `${USERS_ENDPOINT}${buildQueryString({ ...filters, page: String(page), page_size: String(pageSize) })}`,
  );
  const items = (response.items ?? []).map(mapUserListDto);

  return {
    items,
    total: response.total ?? items.length,
    page: response.page ?? page,
    pageSize: response.page_size ?? pageSize,
    hasMore: response.has_more ?? false,
  };
}

export async function downloadUsersExcel(filters: UserFilters = {}) {
  return http<Blob>(`${USERS_EXPORT_ENDPOINT}${buildQueryString(filters)}`, {
    method: 'GET',
    responseType: 'blob',
  });
}

export async function importUsersExcel(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return http<UsersImportResult>(USERS_IMPORT_ENDPOINT, {
    method: 'POST',
    body: formData,
  });
}

function buildQueryString(filters: UserFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    params.set(key, normalizeDateTimeFilter(key, value));
  });

  const query = params.toString();

  return query ? `?${query}` : '';
}

function normalizeDateTimeFilter(key: string, value: string) {
  if (key !== 'created_from' && key !== 'created_to') {
    return value;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : toApiDateTime(date);
}

export async function getUserById(userId: number) {
  const response = await http<UserDetailsDto>(`${USERS_ENDPOINT}/${userId}`);

  return mapUserDetailsDto(response);
}

export async function updateUser(userId: number, payload: UserPatchPayload) {
  const response = await http<UserDetailsDto>(`${USERS_ENDPOINT}/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  return mapUserDetailsDto(response);
}

export async function registerUser(payload: RegisterUserPayload) {
  return http<UserDetailsDto | UserListDto | unknown>(REGISTER_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function activateUser(userId: number) {
  await http<void>(`${USERS_ENDPOINT}/${userId}/activate`, {
    method: 'POST',
  });
}

export async function deactivateUser(userId: number) {
  await http<void>(`${USERS_ENDPOINT}/${userId}/deactivate`, {
    method: 'POST',
  });
}

export function getUserStatusLabel(user: Pick<UserListItem, 'active' | 'status'>) {
  if (user.active || user.status === 'active') {
    return 'Активен';
  }

  return 'Неактивен';
}

function normalizeUsersResponse(response: UsersResponse) {
  if (Array.isArray(response)) {
    return response;
  }

  return response.results ?? response.items ?? response.data ?? [];
}

function mapUserListDto(user: UserListDto): UserListItem {
  return {
    id: user.id,
    active: user.active,
    status: user.active ? 'active' : 'inactive',
    username: user.username,
    fullName: user.full_name,
    maxUserId: user.max_user_id,
    role: user.role,
    region: user.region,
    orgUnit: user.org_unit,
  };
}

function mapUserDetailsDto(user: UserDetailsDto): UserDetails {
  return {
    id: user.id,
    active: user.active === true || user.active === 'true' || user.status === 'active',
    status: user.status,
    username: user.username,
    fullName: user.full_name,
    role: user.role,
    region: user.region,
    orgUnit: user.org_unit,
    headUser: user.head_user,
    maxUserId: user.max_user_id,
    phone: user.phone,
    birthday: user.birthday,
    createdAt: user.created_at,
  };
}
