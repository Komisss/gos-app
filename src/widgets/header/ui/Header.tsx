import {
  SidebarTrigger
} from "@/shared/ui/sidebar"
import {PanelLeft} from "lucide-react";
import { useAuth } from "@/features/auth/model/AuthContext";
import {UserDropdown} from "./UserDropdown.tsx";

export default function Header({className = ''}: {className?: string}) {
  const { session } = useAuth();

  return (
    <div className={`h-[70px] bg-white w-full flex items-center shadow-xl ${className}`}>
      <div className="w-full flex items-center justify-between p-5">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="md:hidden h-8 w-8 shrink-0 text-white bg-black">
            <PanelLeft color="black" fill="black" />
          </SidebarTrigger>
          <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600">
            <span className="text-slate-400">Роль: </span>
            <span className="font-medium text-slate-900">{session?.role?.name ?? 'Не указана'}</span>
          </div>
        </div>
        <div>
          <UserDropdown/>
        </div>
      </div>
    </div>
  )
}
