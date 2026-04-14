import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

const regions = [
  "Выберите регион",
  "Федеральный",
  "Московская область",
  "Санкт-Петербург",
  "Алтайский край",
];

export function ProfileForm() {
  const [region, setRegion] = useState(regions[0]);

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold !text-slate-900">Профиль</h1>
        </div>

        <Card className="gap-0 border-slate-200 bg-white shadow-sm">

          <CardContent className="flex flex-col gap-10 px-6 pb-8">
            <div className="grid gap-5 md:max-w-2xl">
              <Field label="Имя">
                <Input defaultValue="Демо-пользователь" className="border-slate-200 bg-white" />
              </Field>

              <Field label="Email">
                <Input defaultValue="Демо-пользователь" className="border-slate-200 bg-white" />
              </Field>
            </div>

            <div className="grid gap-5 md:max-w-2xl">
              <Field label="Текущий пароль">
                <Input type="password" className="border-slate-200 bg-white" />
              </Field>

              <Field label="Новый пароль">
                <Input type="password" className="border-slate-200 bg-white" />
              </Field>

              <Field label="Подтвердите пароль">
                <Input type="password" className="border-slate-200 bg-white" />
              </Field>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <Button className="bg-[#465cd3] text-white hover:bg-[#3c50bd]">
                Сохранить изменения
              </Button>
            </div>
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
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {children}
    </div>
  );
}


