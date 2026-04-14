import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import {ChevronDown} from 'lucide-react'
import {regions} from '../config/regions'
import {useCallback, useState} from "react";

export function Region() {
  const [regionName, setRegionName] = useState("Выберите регион")
  const regionClickHandler = useCallback((event: Event) => {
    setRegionName(event?.currentTarget?.getHTML());
  }, [])
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center text-[12px] sm:text-[14px]"><span>{regionName}</span><ChevronDown/></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent  className="w-40 rounded-[0px]" align="center">
        <DropdownMenuGroup>
          {regions.map(region => (
            <DropdownMenuItem onSelect={regionClickHandler} className="flex items-center">
                {region}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}