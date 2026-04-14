import { Download, Plus, Upload } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { mockUsers, UserRegistryTable } from "./UserRegistryTable";

export function UserRegistry() {
  return (
    <div className="min-h-full bg-slate-50">

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold !text-slate-900">Список пользователей</h1>
            <div className="space-y-1 text-sm text-slate-500">
              <p>Итого</p>
              <p className="text-base font-semibold text-slate-900">0</p>
            </div>
          </div>

          <Button className="bg-[#6d79ea] text-white hover:bg-[#5c67d9]">
            <Download />
            Скачать XLSX
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <Button className="bg-[#5f74e8] text-white hover:bg-[#5063cf]">
              <Plus />
              Добавить пользователя
            </Button>
            <Button className="bg-emerald-500 text-white hover:bg-emerald-600">
              <Upload />
              Импорт пользователей
            </Button>
          </div>
        </div>

        <UserRegistryTable users={mockUsers} />
      </div>
    </div>
  );
}
