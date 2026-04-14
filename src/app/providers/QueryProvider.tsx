import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Создаём клиент один раз вне компонента
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Данные считаются свежими 5 минут
      retry: 1, // Повторить запрос 1 раз при ошибке
      refetchOnWindowFocus: false, // Не перезапрашивать при возврате вкладки (важно для TMA!)
    },
  },
});

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};