import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import {ChevronDown, User, Power} from 'lucide-react'
import { Link } from "react-router-dom"

export function UserDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center text-[12px] sm:text-[14px]"><span>Демо-пользователь</span><ChevronDown/></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent  className="w-40 rounded-[0px]" align="center">
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="flex items-center">
            <Link to="/profile" className="flex items-center gap-1.5">
              <User/>
              <span>Профиль</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="text-red-700 flex items-center">
            <div className="flex items-center gap-1.5">
              <Power/>
              <span>Выйти</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
