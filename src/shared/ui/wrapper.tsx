import type {ReactNode} from "react";
import {cn} from "@shared/lib/utils.ts";

export default function BorderWrapper({className, children}: {className?: string, children: ReactNode}) {
  return(
    <div className={cn('border-stroke rounded-[10px] border px-[8px] py-[8px]', className)}>
      {children}
    </div>
  )
}