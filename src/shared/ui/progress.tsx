import * as React from 'react';

import { cn } from '@/shared/lib/utils';

function Progress({
  className,
  value = 0,
  ...props
}: React.ComponentProps<'div'> & { value?: number }) {
  const normalizedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      data-slot="progress"
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-slate-200', className)}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full rounded-full bg-[#465cd3] transition-all"
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  );
}

export { Progress };
