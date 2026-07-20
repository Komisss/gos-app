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
import { USER_ROLE_IDS } from '@/entities/user/model/roleOptions';
import { useAuth } from '@/features/auth/model/AuthContext';
import { useCurrentUserRegion } from '@/features/auth/model/useCurrentUserRegion';

export function NavigationSidebar() {
  const location = useLocation();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const { session } = useAuth();
  const roleId = session?.role?.id;
  const isRegionalManager = roleId === USER_ROLE_IDS.regionalManager;
  const { regionId: currentUserRegionId } = useCurrentUserRegion();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center justify-between gap-2 px-3 py-3 [&>span:first-child]:truncate group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:[&>span:first-child]:hidden">
        <span>СУОМ</span>
        <SidebarTrigger className="h-8 w-8 shrink-0 text-white">
          <PanelLeft />
        </SidebarTrigger>
      </SidebarHeader>
      <SidebarContent>
        {sidebarSections.map((section, index) => {
          return (
            <SidebarGroup key={index}>
              {section.title && <SidebarGroupLabel>{section.title ? (<div className="px-4 text-sm">{section.title}</div>) : ''}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu className="gap-0">
                  {section.items
                    .filter((item) => !('roleIds' in item) || !item.roleIds || item.roleIds.includes(roleId ?? 0))
                    .map((item, navIndex) => {
                    const Icon = item.icon;
                    const itemHref = getNavigationItemHref(
                      item.href,
                      isRegionalManager,
                      currentUserRegionId,
                    );
                    const itemKey = `${index}-${navIndex}`;
                    const isNested = 'items' in item && Array.isArray(item.items);

                    if (isNested) {
                      const isActive = item.items.some((child) =>
                        isNavigationItemActive(child.href, location.pathname, isRegionalManager),
                      );
                      const isOpen = openItems[itemKey] ?? isActive;

                      return (
                        <SidebarMenuItem key={itemKey}>
                          <SidebarMenuButton
                            tooltip={item.label}
                            className={clsx(isActive ? "bg-[#465cd3]" : "", "rounded-[0px]")}
                            onClick={() => setOpenItems((current) => ({ ...current, [itemKey]: !isOpen }))}
                          >
                            {Icon && <Icon size={16} />}
                            <span className="text-[15px] text-white">{item.label}</span>
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
                                    className={clsx(
                                      isNavigationItemActive(child.href, location.pathname, isRegionalManager)
                                        ? "bg-[#465cd3]"
                                        : "",
                                    )}
                                  >
                                    <NavLink to={child.href}>
                                      <span className="text-[15px] text-white">{child.label}</span>
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
                          className={clsx(
                            isNavigationItemActive(item.href, location.pathname, isRegionalManager)
                              ? "bg-[#465cd3]"
                              : "",
                            "rounded-[0px]",
                          )}
                        >
                          <NavLink to={itemHref}>
                            {Icon && <Icon size={16} />}
                            <span className="text-[15px] text-white">{item.label}</span>
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

function getNavigationItemHref(
  href: string | undefined,
  isRegionalManager: boolean,
  regionId: number | null,
) {
  if (href === '/stats/dashboard' && isRegionalManager && regionId) {
    return `/stats/dashboard/region/${regionId}`;
  }

  return href ?? '#';
}

function isNavigationItemActive(
  href: string | undefined,
  pathname: string,
  isRegionalManager: boolean,
) {
  if (!href) {
    return false;
  }

  if (href === '/stats/dashboard') {
    return isRegionalManager
      ? pathname.startsWith('/stats/dashboard/region/')
      : pathname === '/stats/dashboard';
  }

  return pathname === href;
}
