import {
  SidebarTrigger
} from "@/shared/ui/sidebar"
import {PanelLeft} from "lucide-react";
import {UserDropdown} from "./UserDropdown.tsx";
import {Region} from "./Region"

export default function Header({className = ''}: {className?: string}) {

  return (
    <div className={`h-[70px] bg-white w-full flex items-center shadow-xl ${className}`}>
      <div className="w-full flex items-center justify-between p-5">
        <SidebarTrigger className="md:hidden h-8 w-8 shrink-0 text-white bg-black">
          <PanelLeft color="black" fill="black" />
        </SidebarTrigger>
        <div className="flex items-center">
          <Region/>
        </div>
        <div>
          <UserDropdown/>
        </div>
      </div>
    </div>
  )
}
