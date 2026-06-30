import { Download, Upload } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { USER_IMPORT_TEMPLATE_URL } from '@/widgets/userCreate/model/userImportTemplate';
import { UserBulkImportDropzone } from '@/widgets/userCreate/ui/UserBulkImportDropzone';

export function UserImportPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" className="bg-[#465cd3] text-white hover:bg-[#3c50bd]">
          <Upload />
          Импорт
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(640px,calc(100vw-2rem))] p-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Импорт пользователей</h2>
              <p className="mt-1 text-xs text-slate-500">
                Загрузите XLSX-файл с пользователями или скачайте шаблон для заполнения.
              </p>
            </div>
            <Button asChild type="button" variant="outline" className="shrink-0 border-slate-200 bg-white">
              <a href={USER_IMPORT_TEMPLATE_URL} download>
                <Download />
                Скачать шаблон
              </a>
            </Button>
          </div>

          <UserBulkImportDropzone />
        </div>
      </PopoverContent>
    </Popover>
  );
}
