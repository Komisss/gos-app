import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { downloadUsersExcel, type UserFilters } from '@/entities/user/api/users';
import { downloadBlob } from '@/shared/lib/downloadBlob';

export const emptyUserExportFilters: UserFilters = {
  org_unit_ids: '',
  region_ids: '',
  roles: '',
  search: '',
  status: '',
};

export function useUserExport() {
  const [filters, setFilters] = useState<UserFilters>(emptyUserExportFilters);
  const [open, setOpen] = useState(false);

  const exportMutation = useMutation({
    mutationFn: () => downloadUsersExcel(filters),
    onSuccess: (blob) => {
      downloadBlob(blob, `users-${new Date().toISOString().slice(0, 10)}.xlsx`);
      setOpen(false);
    },
  });

  return {
    exportError: exportMutation.isError,
    exportFilters: filters,
    exportOpen: open,
    exportPending: exportMutation.isPending,
    resetExportFilters: () => setFilters(emptyUserExportFilters),
    runExport: () => exportMutation.mutate(),
    setExportFilters: setFilters,
    setExportOpen: setOpen,
  };
}
