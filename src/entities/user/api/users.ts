import { http } from '@/shared/api/http';
import type {
  UserDetails,
  UserDetailsDto,
  UserListDto,
  UserListItem,
  UserPatchPayload,
} from '@/entities/user/model/types';

const USERS_ENDPOINT = '/api/v1/users';

type UsersResponse =
  | UserListDto[]
  | {
      results?: UserListDto[];
      items?: UserListDto[];
      data?: UserListDto[];
    };

export async function getUsers() {
  const response = await http<UsersResponse>(USERS_ENDPOINT);

  return normalizeUsersResponse(response).map(mapUserListDto);
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
    role: user.role,
    region: user.region,
    orgUnit: user.org_unit,
  };
}

function mapUserDetailsDto(user: UserDetailsDto): UserDetails {
  return {
    id: user.id,
    active: user.status === 'active',
    status: user.status,
    username: user.username,
    fullName: user.full_name,
    role: user.role,
    region: user.region,
    orgUnit: user.org_unit,
    headUser: user.head_user,
    phone: user.phone,
    birthday: user.birthday,
    createdAt: user.created_at,
  };
}
