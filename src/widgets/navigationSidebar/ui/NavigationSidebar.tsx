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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarTrigger
} from "@/shared/ui/sidebar"
import {ChevronDown, PanelLeft} from "lucide-react";
import {sidebarSections} from '../config/navigationConfig.ts';
import {NavLink, useLocation} from "react-router";
import {clsx} from 'clsx'
import {useState} from "react";
import { useAuth } from '@/features/auth/model/AuthContext';

export function NavigationSidebar() {
  const location = useLocation();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const { session } = useAuth();
  const roleCode = session?.role?.code;

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
                  {section.items
                    .filter((item) => !('roles' in item) || !item.roles || item.roles.includes(roleCode ?? ''))
                    .map((item, navIndex) => {
                    const Icon = item.icon;
                    const itemKey = `${index}-${navIndex}`;
                    const isNested = 'items' in item && Array.isArray(item.items);

                    if (isNested) {
                      const isActive = item.items.some((child) => location.pathname === child.href);
                      const isOpen = openItems[itemKey] ?? isActive;

                      return (
                        <SidebarMenuItem key={itemKey}>
                          <SidebarMenuButton
                            tooltip={item.label}
                            className={clsx(isActive ? "bg-[#465cd3]" : "", "rounded-[0px]")}
                            onClick={() => setOpenItems((current) => ({ ...current, [itemKey]: !isOpen }))}
                          >
                            {Icon && <Icon size={16} />}
                            <span className="text-[13px] text-white">{item.label}</span>
                            <ChevronDown
                              size={14}
                              className={clsx(
                                "ml-auto transition-transform group-data-[collapsible=icon]:hidden",
                                isOpen ? "rotate-180" : ""
                              )}
                            />
                          </SidebarMenuButton>

                          {isOpen && (
                            <SidebarMenuSub>
                              {item.items.map((child) => (
                                <SidebarMenuSubItem key={child.href}>
                                  <SidebarMenuSubButton
                                    asChild
                                    className={clsx(location.pathname === child.href ? "bg-[#465cd3]" : "")}
                                  >
                                    <NavLink to={child.href}>
                                      <span className="text-[13px] text-white">{child.label}</span>
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          )}
                        </SidebarMenuItem>
                      );
                    }

                    return (
                      <SidebarMenuItem key={itemKey}>
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
