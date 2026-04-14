import { useMemo, useState } from "react"
import { ArrowLeft, Download, FileSpreadsheet, MapPinned } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { DatePicker } from "@/shared/ui/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Separator } from "@/shared/ui/separator"

const taskTypes = [
  "Выберите тип задачи",
  "Мониторинг",
  "Отчетность",
  "Проверка",
  "Сопровождение",
]

const reportRegions = [
  "Выберите регион",
  "Федеральный",
  "Алтайский край",
  "Амурская область",
  "Архангельская область",
  "Астраханская область",
  "Белгородская область",
  "Брянская область",
]

export function StatisticsWorkspace() {
  const [taskType, setTaskType] = useState("")
  const [date, setDate] = useState<Date | undefined>()
  const [reportRegion, setReportRegion] = useState("")

  const canBuildReport = useMemo(() => {
    return Boolean(taskType && date && reportRegion)
  }, [date, reportRegion, taskType])

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">
          <div className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold !text-slate-900">Статистика</h1>
                <p className="text-sm text-slate-500">Сформируйте выгрузку по типу задачи, дате и региону.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                >
                  <Download />
                  Экспорт в XLS
                </Button>
              </div>
            </div>
          </div>
        <Card className="gap-0 border-slate-200 bg-white shadow-sm">
          <CardContent className="px-6 py-6">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_220px_minmax(0,1fr)]">
              <Field label="Тип задачи">
                <Select value={taskType} onValueChange={setTaskType}>
                  <SelectTrigger className="w-full border-slate-200 bg-white">
                    <SelectValue placeholder="Выберите тип задачи" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {taskTypes.slice(1).map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Дата">
                <DatePicker
                  value={date}
                  onChange={setDate}
                  placeholder="Выберите дату"
                />
              </Field>

              <Field label="Регион">
                <Select value={reportRegion} onValueChange={setReportRegion}>
                  <SelectTrigger className="w-full border-slate-200 bg-white">
                    <SelectValue placeholder="Выберите регион" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {reportRegions.slice(1).map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="mt-6">
              {canBuildReport ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/70 px-6 text-center">
                  <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <FileSpreadsheet className="size-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Отчет готов к формированию
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                    Вы выбрали все обязательные параметры. Следующим шагом здесь
                    можно будет показать таблицу статистики или предпросмотр
                    выгрузки.
                  </p>
                </div>
              ) : (
                <div className="flex min-h-[360px] flex-col justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6">
                  <p className="text-sm text-slate-500">
                    Не хватает параметров для генерации таблицы.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-600 !mb-1">{label}</p>
      {children}
    </div>
  )
}
