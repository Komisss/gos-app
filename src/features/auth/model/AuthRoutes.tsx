import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <AuthRouteLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  const from = getRedirectPath(location.state);

  if (isInitializing) {
    return <AuthRouteLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}

export function StatisticsRoute() {
  const { session } = useAuth();
  const isRegionalManager =
    session?.role?.code === 'regional_manager' || session?.role?.id === 2;

  if (isRegionalManager) {
    return <Navigate to="/tasks" replace />;
  }

  return <Outlet />;
}

function AuthRouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">
      Проверяем сессию...
    </div>
  );
}

function getRedirectPath(state: unknown) {
  if (
    state &&
    typeof state === 'object' &&
    'from' in state &&
    state.from &&
    typeof state.from === 'object' &&
    'pathname' in state.from &&
    typeof state.from.pathname === 'string'
  ) {
    return state.from.pathname;
  }

  return '/stats';
}
