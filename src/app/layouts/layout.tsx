import { Outlet } from 'react-router-dom';
import {SidebarProvider} from "@shared/ui/sidebar.tsx";
import {NavigationSidebar} from "@widgets/navigationSidebar/ui/NavigationSidebar.tsx";
import Header from "@widgets/header/ui/Header.tsx";
import { useAuth } from '@/features/auth/model/AuthContext';

export function MainLayout() {
  const { session } = useAuth();
  const hideStatistics =
    session?.role?.code === 'regional_manager' || session?.role?.id === 2;

  return (
    <div className="h-screen overflow-hidden">
      <SidebarProvider
        className={`h-full overflow-hidden ${hideStatistics ? '[&_[data-sidebar=group]:first-child]:hidden' : ''}`}
      >
        <NavigationSidebar />
        <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <Header className="shrink-0" />
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-50">
            <Outlet />
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
