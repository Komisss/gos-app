import { useState, type FormEvent } from 'react';
import { LockKeyhole, LogIn, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useAuth } from '@/features/auth/model/AuthContext';

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = getRedirectPath(location.state);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ username: username.trim(), password });
      navigate(redirectTo, { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Не удалось выполнить вход');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen bg-slate-100">
      <section className="flex min-h-screen flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-white lg:hidden">
              <LockKeyhole className="size-5" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-950">Вход</h2>
            <p className="mt-2 text-sm text-slate-500">Введите учетные данные для доступа к системе.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="username">
                Логин
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  className="h-11 pl-9"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">
                Пароль
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="h-11 pl-9"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button className="h-11 w-full" type="submit" disabled={isSubmitting}>
              <LogIn className="size-4" />
              {isSubmitting ? 'Выполняется вход...' : 'Войти'}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}

function getRedirectPath(state: unknown) {
  const locationState = state as LocationState | null;

  return locationState?.from?.pathname ?? '/stats';
}
