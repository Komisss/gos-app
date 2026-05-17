import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet, Upload } from 'lucide-react';

import { importUsersExcel, type UsersImportResult } from '@/entities/user/api/users';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { toast } from '@/shared/ui/sonner';

const xlsxMimeTypes = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]);

export function UserBulkImportDropzone() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const importMutation = useMutation({
    mutationFn: importUsersExcel,
    onSuccess: async (result) => {
      setFileError(null);
      showImportResultToast(result);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  function handleFile(file?: File) {
    if (!file) {
      return;
    }

    if (!isXlsxFile(file)) {
      setFileError('Выберите файл в формате XLSX.');
      return;
    }

    setSelectedFileName(file.name);
    setFileError(null);
    importMutation.mutate(file);
  }

  return (
    <section
      className={cn(
        'rounded-lg border border-dashed bg-white p-5 shadow-sm transition-colors',
        isDragging ? 'border-[#465cd3] bg-[#465cd3]/5' : 'border-slate-300',
      )}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFile(event.dataTransfer.files.item(0) ?? undefined);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={(event) => handleFile(event.target.files?.item(0) ?? undefined)}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#465cd3]/10 text-[#465cd3]">
            <FileSpreadsheet size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">Массовое добавление пользователей</h2>
            <p className="mt-1 text-sm text-slate-500">
              Выберите XLSX-файл или перетащите его в эту область.
            </p>
            {selectedFileName && (
              <p className="mt-2 truncate text-xs font-medium text-slate-700">Файл: {selectedFileName}</p>
            )}
            {fileError && <p className="mt-2 text-xs font-medium text-red-600">{fileError}</p>}
            {importMutation.isSuccess && !importMutation.isPending && (
              <p className="mt-2 text-xs font-medium text-emerald-700">Файл отправлен на импорт.</p>
            )}
            {importMutation.isError && (
              <p className="mt-2 text-xs font-medium text-red-600">Не удалось импортировать пользователей.</p>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="shrink-0 border-slate-200 bg-white"
          disabled={importMutation.isPending}
          onClick={() => inputRef.current?.click()}
        >
          <Upload />
          {importMutation.isPending ? 'Загрузка...' : 'Выбрать XLSX'}
        </Button>
      </div>
    </section>
  );
}

function isXlsxFile(file: File) {
  return file.name.toLowerCase().endsWith('.xlsx') || xlsxMimeTypes.has(file.type);
}

function showImportResultToast(result: UsersImportResult) {
  const hasErrors = result.errors.length > 0;
  const title = hasErrors ? 'Импорт пользователей завершен с ошибками' : 'Пользователи импортированы';
  const description = (
    <div className="space-y-2">
      <p>
        Создано: {result.created}, обновлено: {result.updated}
      </p>
      {hasErrors && (
        <div className="space-y-1">
          <p>Ошибки: {result.errors.length}</p>
          <ul className="max-h-40 space-y-1 overflow-auto pr-1">
            {result.errors.slice(0, 10).map((item) => (
              <li key={`${item.row}-${item.error}`}>
                Строка {item.row}: {item.error}
              </li>
            ))}
          </ul>
          {result.errors.length > 10 && <p>И еще {result.errors.length - 10}</p>}
        </div>
      )}
    </div>
  );

  const options = { description, duration: hasErrors ? 12000 : 6000 };

  if (hasErrors) {
    toast.warning(title, options);
    return;
  }

  toast.success(title, options);
}
