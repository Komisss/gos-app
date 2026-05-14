import { toast } from '@/shared/ui/sonner';

import { getApiErrorDescription, getErrorMessage } from '@/shared/lib/apiError';

export function showErrorToast(error: unknown) {
  toast.error(getErrorMessage(error), {
    description: getApiErrorDescription(error),
    duration: 8000,
  });
}
