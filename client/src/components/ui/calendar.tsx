'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { cn } from '@/lib/utils';

export type CalendarProps = DayPickerProps;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3 select-none', className)}
      classNames={{
        months: 'relative',
        month: 'flex flex-col gap-4',
        month_caption: 'flex items-center justify-center h-7 mb-1',
        caption_label: 'text-sm font-semibold text-slate-800',
        nav: 'absolute inset-x-0 top-0 flex items-center justify-between px-1',
        button_previous: cn(
          'inline-flex items-center justify-center rounded-md h-7 w-7 border border-slate-200 bg-white text-slate-600',
          'hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
        ),
        button_next: cn(
          'inline-flex items-center justify-center rounded-md h-7 w-7 border border-slate-200 bg-white text-slate-600',
          'hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'flex-1 text-center text-xs font-medium text-slate-400 py-1',
        week: 'flex w-full mt-1',
        day: 'flex-1 flex items-center justify-center p-0',
        day_button: cn(
          'h-9 w-9 rounded-md text-sm font-normal transition-colors',
          'hover:bg-slate-100 hover:text-slate-900',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        ),
        selected: '[&>button]:bg-blue-600 [&>button]:text-white [&>button]:hover:bg-blue-700 [&>button]:hover:text-white',
        today: '[&>button]:bg-slate-100 [&>button]:font-semibold',
        outside: '[&>button]:text-slate-300 [&>button]:hover:bg-transparent',
        disabled: '[&>button]:opacity-40 [&>button]:cursor-not-allowed',
        range_middle: '[&>button]:bg-blue-100 [&>button]:rounded-none',
        range_start: '[&>button]:bg-blue-600 [&>button]:text-white [&>button]:rounded-l-md',
        range_end: '[&>button]:bg-blue-600 [&>button]:text-white [&>button]:rounded-r-md',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left'
            ? <ChevronLeft className="h-4 w-4" />
            : <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };
