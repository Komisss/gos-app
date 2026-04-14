import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarTrigger
} from "@/shared/ui/sidebar"
import {PanelLeft} from "lucide-react";
import {sidebarSections} from '../config/navigationConfig.ts';
import {NavLink, useLocation} from "react-router";
import {clsx} from 'clsx'

export function NavigationSidebar() {
  const location = useLocation();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center justify-between gap-2 px-3 py-3 [&>span:first-child]:truncate group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:[&>span:first-child]:hidden">
        <span>Сеть</span>
        <SidebarTrigger className="h-8 w-8 shrink-0 text-white">
          <PanelLeft />
        </SidebarTrigger>
      </SidebarHeader>
      <SidebarContent>
        {sidebarSections.map((section, index) => {
          return (
            <SidebarGroup key={index}>
              {section.title && <SidebarGroupLabel>{section.title ? (<div className="px-4">{section.title}</div>) : ''}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu className="gap-0">
                  {section.items.map((item, navIndex) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={navIndex}>
                        <SidebarMenuButton
                          asChild
                          tooltip={item.label}
                          className={clsx(location.pathname === item.href ? "bg-[#465cd3]" : "", "rounded-[0px]")}
                        >
                          <NavLink to={item.href}>
                            {Icon && <Icon size={16} />}
                            <span className="text-[13px] text-white">{item.label}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })
                  }
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
