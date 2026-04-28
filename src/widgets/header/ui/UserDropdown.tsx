import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { useAuth } from '@/features/auth/model/AuthContext';
import { ChevronDown, Power, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function UserDropdown() {
  const { logout, session } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center text-[12px] sm:text-[14px]">
          <span>{session?.username ?? 'Пользователь'}</span>
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40 rounded-[0px]" align="center">
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="flex items-center">
            <Link to="/profile" className="flex items-center gap-1.5">
              <User />
              <span>Профиль</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center text-red-700" onClick={handleLogout}>
            <div className="flex items-center gap-1.5">
              <Power />
              <span>Выйти</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
