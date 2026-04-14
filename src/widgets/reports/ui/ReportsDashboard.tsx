import { useState } from "react";
import { Download, FileText } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { DatePicker } from "@/shared/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { TableScrollArea } from "@/shared/ui/table-scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

const groups = ["Группа быстрого реагирования", "Федеральная группа", "Оперативная группа"];
const roles = ["Координатор", "Наблюдатель", "Аналитик"];
const users = ["Пользователь X-01", "Пользователь X-02", "Пользователь X-03"];
const taskTypes = ["Мониторинг", "Проверка", "Оповещение"];
const fileFormats = ["docx", "xlsx", "pdf"];

const generatedReports = [
  {
    id: 49654,
    createdAt: "создан: 2026-02-23 13:38:36",
    taskType: "Мониторинг",
    user: "Пользователь X-01",
    status: "Готов",
  },
  {
    id: 49653,
    createdAt: "создан: 2026-02-23 13:18:29",
    taskType: "Проверка",
    user: "Пользователь X-02",
    status: "Готов",
  },
    {
    id: 49653,
    createdAt: "создан: 2026-02-23 13:18:29",
    taskType: "Проверка",
    user: "Пользователь X-02",
    status: "Готов",
  },
    {
    id: 49653,
    createdAt: "создан: 2026-02-23 13:18:29",
    taskType: "Проверка",
    user: "Пользователь X-02",
    status: "Готов",
  },
    {
    id: 49653,
    createdAt: "создан: 2026-02-23 13:18:29",
    taskType: "Проверка",
    user: "Пользователь X-02",
    status: "Готов",
  },
    {
    id: 49653,
    createdAt: "создан: 2026-02-23 13:18:29",
    taskType: "Проверка",
    user: "Пользователь X-02",
    status: "Готов",
  },
    {
    id: 49653,
    createdAt: "создан: 2026-02-23 13:18:29",
    taskType: "Проверка",
    user: "Пользователь X-02",
    status: "Готов",
  },
];

export function ReportsDashboard() {
  const [reportDate, setReportDate] = useState<Date | undefined>();
  const [migrationDate, setMigrationDate] = useState<Date | undefined>();

  return (
    <div className="min-h-full bg-slate-50">

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold !text-slate-900">Дашборд</h1>
          <p className="text-sm text-slate-500">Сформируйте выгрузку по группам, ролям и пользователям.</p>
        </div>

        <Card className="gap-0 border-slate-200 bg-white shadow-sm">
          <CardHeader className="px-6 pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900">Генерация отчета</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-1">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Группы">
                <Select defaultValue={groups[0]}>
                  <SelectTrigger className="w-full border-slate-200 bg-white">
                    <SelectValue placeholder="Выберите группы" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {groups.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Роль">
                <Select>
                  <SelectTrigger className="w-full border-slate-200 bg-white">
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {roles.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Пользователь">
                <Select>
                  <SelectTrigger className="w-full border-slate-200 bg-white">
                    <SelectValue placeholder="Выберите пользователя" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {users.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Типы задач">
                <Select>
                  <SelectTrigger className="w-full border-slate-200 bg-white">
                    <SelectValue placeholder="Выберите типы задач" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {taskTypes.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Даты">
                <DatePicker value={reportDate} onChange={setReportDate} placeholder="Выберите дату" />
              </Field>

              <Field label="Формат файла">
                <Select defaultValue={fileFormats[0]}>
                  <SelectTrigger className="w-full border-slate-200 bg-white">
                    <SelectValue placeholder="Выберите формат" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {fileFormats.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="mt-5 flex justify-end">
              <Button className="bg-[#6d79ea] text-white hover:bg-[#5c67d9]">Сгенерировать</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 border-slate-200 bg-white shadow-sm">
          <CardHeader className="px-6 pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900">Отчет по миграциям</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-1">
            <div className="grid gap-5 md:grid-cols-[220px_1fr] md:items-end">
              <Field label="Даты">
                <DatePicker value={migrationDate} onChange={setMigrationDate} placeholder="Выберите дату" />
              </Field>
              <div className="flex justify-start md:justify-end">
                <Button className="bg-[#6d79ea] text-white hover:bg-[#5c67d9]">Сгенерировать</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 border-slate-200 bg-white shadow-sm">
          <CardHeader className="px-6 pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900">История генераций</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <TableScrollArea className="rounded-none border-0" height="30rem">
              <Table className="min-w-[920px] whitespace-nowrap">
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b-slate-200">
                    <TableHead className="w-24">#</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Типы задач</TableHead>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Скачать</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedReports.map((report, index) => (
                    <TableRow key={report.id} className={`border-b-slate-200 ${index % 2 === 0 ? "bg-white" : "bg-slate-100"}`}>
                      <TableCell>{report.id}</TableCell>
                      <TableCell className="text-slate-600">{report.createdAt}</TableCell>
                      <TableCell>{report.taskType}</TableCell>
                      <TableCell>{report.user}</TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          {report.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon-sm" variant="ghost" className="text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                          <Download size={15} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 !mb-1">{label}</p>
      {children}
    </div>
  );
}


