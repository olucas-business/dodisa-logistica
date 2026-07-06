import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

const FULL_MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const SHORT_MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface MonthYearPickerProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export default function MonthYearPicker({ month, year, onChange }: MonthYearPickerProps) {
  const today = new Date();
  const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);

  const goToPrevMonth = () => {
    if (month === 1) onChange(12, year - 1);
    else onChange(month - 1, year);
  };

  const goToNextMonth = () => {
    if (month === 12) onChange(1, year + 1);
    else onChange(month + 1, year);
  };

  const openPicker = () => {
    setPickerYear(year);
    setPickerOpen(true);
  };

  return (
    <div className="flex items-center gap-1 bg-muted px-1.5 py-1.5 rounded-lg border border-border">
      <button
        onClick={goToPrevMonth}
        className="p-1 hover:bg-card rounded-md text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        title="Mês anterior"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <div className="relative">
        <button
          onClick={() => (pickerOpen ? setPickerOpen(false) : openPicker())}
          className="flex items-center gap-1.5 text-xs font-bold text-foreground px-1.5 min-w-[110px] justify-center cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          title="Escolher mês e ano"
        >
          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
          {FULL_MONTH_NAMES[month - 1]} {year}
        </button>
        {pickerOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 z-50 bg-card border border-border rounded-xl shadow-2xl p-3 w-60 animate-scale-in">
              <div className="flex items-center justify-between mb-2.5 px-1">
                <button
                  onClick={() => setPickerYear(y => y - 1)}
                  className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-black text-foreground">{pickerYear}</span>
                <button
                  onClick={() => setPickerYear(y => y + 1)}
                  className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {SHORT_MONTH_NAMES.map((m, idx) => {
                  const monthNum = idx + 1;
                  const isSelected = monthNum === month && pickerYear === year;
                  const isCurrent = monthNum === today.getMonth() + 1 && pickerYear === today.getFullYear();
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        onChange(monthNum, pickerYear);
                        setPickerOpen(false);
                      }}
                      className={`text-[11px] font-bold py-1.5 rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                          : isCurrent
                            ? "border border-blue-500/50 text-blue-500 dark:text-blue-400"
                            : "hover:bg-muted text-foreground"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
      <button
        onClick={goToNextMonth}
        className="p-1 hover:bg-card rounded-md text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        title="Próximo mês"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
      {!isCurrentMonth && (
        <button
          onClick={() => onChange(today.getMonth() + 1, today.getFullYear())}
          className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline px-1.5 cursor-pointer"
        >
          Hoje
        </button>
      )}
    </div>
  );
}
