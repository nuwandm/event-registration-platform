import * as React from 'react';
import { format, setHours, setMinutes } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateTimePickerProps {
  value?: string; // ISO or datetime-local string
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function parseToDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DateTimePicker({ value, onChange, placeholder = 'Pick date & time', disabled, className }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseToDate(value);

  const hours = selected?.getHours() ?? 0;
  const minutes = selected?.getMinutes() ?? 0;

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    const base = selected ?? new Date();
    const next = setMinutes(setHours(day, base.getHours()), base.getMinutes());
    onChange(toDatetimeLocal(next));
  };

  const handleTimeChange = (type: 'hours' | 'minutes', val: number) => {
    const base = selected ?? new Date();
    const next = type === 'hours' ? setHours(base, val) : setMinutes(base, val);
    onChange(toDatetimeLocal(next));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal h-10',
            !selected && 'text-slate-400',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
          {selected ? format(selected, 'MMM d, yyyy  hh:mm a') : placeholder}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto" align="start">
        {/* Calendar */}
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleDaySelect}
          initialFocus
        />

        {/* Time picker */}
        <div className="border-t border-slate-100 px-4 py-3 flex items-center gap-3">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex items-center gap-1">
            {/* Hours */}
            <select
              value={hours}
              onChange={(e) => handleTimeChange('hours', Number(e.target.value))}
              className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {String(i).padStart(2, '0')}
                </option>
              ))}
            </select>
            <span className="text-slate-400 font-bold">:</span>
            {/* Minutes */}
            <select
              value={minutes}
              onChange={(e) => handleTimeChange('minutes', Number(e.target.value))}
              className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
          <Button
            size="sm"
            className="ml-auto"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
