import * as React from 'react';
import { format, setHours, setMinutes } from 'date-fns';
import { CalendarIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateTimePickerProps {
  value?: string;
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

// ── Spinner column ────────────────────────────────────────────────────────────
function TimeSpinner({
  display,
  onIncrement,
  onDecrement,
  label,
}: {
  display: string;
  onIncrement: () => void;
  onDecrement: () => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">
        {label}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        className="w-10 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
      >
        <ChevronUp className="w-4 h-4" />
      </button>
      <div className="w-12 h-11 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
        <span className="text-xl font-bold text-slate-800 tabular-nums">{display}</span>
      </div>
      <button
        type="button"
        onClick={onDecrement}
        className="w-10 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Main picker ───────────────────────────────────────────────────────────────
export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Pick date & time',
  disabled,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseToDate(value);

  const hour24 = selected?.getHours() ?? 9;
  const minutes = selected?.getMinutes() ?? 0;
  const isPM = hour24 >= 12;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  const applyTime = (h24: number, m: number) => {
    const base = selected ?? new Date();
    onChange(toDatetimeLocal(setMinutes(setHours(base, h24), m)));
  };

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    const base = selected ?? new Date();
    onChange(toDatetimeLocal(setMinutes(setHours(day, base.getHours()), base.getMinutes())));
  };

  const incrementHour = () => applyTime((hour24 + 1) % 24, minutes);
  const decrementHour = () => applyTime((hour24 - 1 + 24) % 24, minutes);
  const incrementMinute = () => applyTime(hour24, (minutes + 5) % 60);
  const decrementMinute = () => applyTime(hour24, (minutes - 5 + 60) % 60);
  const toggleAMPM = (toAM: boolean) => {
    if (toAM && isPM) applyTime(hour24 - 12, minutes);
    if (!toAM && !isPM) applyTime(hour24 + 12, minutes);
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

      <PopoverContent className="w-auto p-0 overflow-hidden" align="start">
        {/* Calendar */}
        <Calendar mode="single" selected={selected} onSelect={handleDaySelect} />

        {/* Time section */}
        <div className="border-t border-slate-100 bg-white px-5 py-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center mb-3">
            Select Time
          </p>

          <div className="flex items-center justify-center gap-2">
            {/* Hour */}
            <TimeSpinner
              label="Hour"
              display={String(hour12).padStart(2, '0')}
              onIncrement={incrementHour}
              onDecrement={decrementHour}
            />

            {/* Colon */}
            <div className="flex flex-col gap-1.5 mt-6 pb-1">
              <div className="w-1 h-1 rounded-full bg-slate-400" />
              <div className="w-1 h-1 rounded-full bg-slate-400" />
            </div>

            {/* Minute */}
            <TimeSpinner
              label="Min"
              display={String(minutes).padStart(2, '0')}
              onIncrement={incrementMinute}
              onDecrement={decrementMinute}
            />

            {/* AM / PM toggle */}
            <div className="flex flex-col gap-1.5 mt-6 ml-1">
              <button
                type="button"
                onClick={() => toggleAMPM(true)}
                className={cn(
                  'w-11 h-[42px] rounded-t-xl text-xs font-bold border transition-colors',
                  !isPM
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                )}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => toggleAMPM(false)}
                className={cn(
                  'w-11 h-[42px] rounded-b-xl text-xs font-bold border transition-colors',
                  isPM
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                )}
              >
                PM
              </button>
            </div>
          </div>

          {/* Done */}
          <Button className="w-full mt-4" size="sm" onClick={() => setOpen(false)}>
            Confirm
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
