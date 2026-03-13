"use client";

import { X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";

interface DatePickerPopoverProps {
  initialStartDate?: string;
  initialDueDate?: string;
  onSave: (startDate: string | null, dueDate: string | null) => void;
  onClose: () => void;
}

export default function DatePickerPopover({
  initialStartDate,
  initialDueDate,
  onSave,
  onClose,
}: DatePickerPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  
  const now = new Date();
  const initStart = initialStartDate ? new Date(initialStartDate) : null;
  const initDue = initialDueDate ? new Date(initialDueDate) : null;
  
  const [viewDate, setViewDate] = useState(new Date((initDue || initStart || now).getFullYear(), (initDue || initStart || now).getMonth(), 1));
  
  const [startDate, setStartDate] = useState<Date | null>(initStart);
  const [dueDate, setDueDate] = useState<Date | null>(initDue);
  
  
  const [timeInput, setTimeInput] = useState(
    initDue ? initDue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).split(' ')[0] : "12:00"
  );
  const [amPm, setAmPm] = useState<'AM' | 'PM'>(
    initDue ? (initDue.getHours() >= 12 ? 'PM' : 'AM') : 'PM'
  );

  const [activeInput, setActiveInput] = useState<'start' | 'due'>(initialStartDate && !initialDueDate ? 'start' : 'due');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDate - i, current: false, date: new Date(year, month - 1, prevMonthLastDate - i) });
    }
    for (let i = 1; i <= lastDate; i++) {
      days.push({ day: i, current: true, date: new Date(year, month, i) });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        days.push({ day: i, current: false, date: new Date(year, month + 1, i) });
    }
    return days;
  }, [viewDate]);

  const monthName = viewDate.toLocaleString('default', { month: 'long' });
  const year = viewDate.getFullYear();

  const handlePrevMonth = () => setViewDate(new Date(year, viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, viewDate.getMonth() + 1, 1));
  const handlePrevYear = () => setViewDate(new Date(year - 1, viewDate.getMonth(), 1));
  const handleNextYear = () => setViewDate(new Date(year + 1, viewDate.getMonth(), 1));

  const handleDateSelect = (date: Date) => {
    if (activeInput === 'start') {
      setStartDate(date);
    } else {
      setDueDate(date);
    }
  };

  const handleSave = () => {
    let finalStart: string | null = null;
    let finalDue: string | null = null;

    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      finalStart = s.toISOString();
    }

    if (dueDate) {
      const d = new Date(dueDate);
      let [hours, minutes] = timeInput.split(':').map(Number);
      if (isNaN(hours)) hours = 12;
      if (isNaN(minutes)) minutes = 0;
      
      let finalHours = hours;
      if (amPm === 'PM' && hours < 12) finalHours += 12;
      if (amPm === 'AM' && hours === 12) finalHours = 0;
      
      d.setHours(finalHours, minutes, 0, 0);
      finalDue = d.toISOString();
    }

    onSave(finalStart, finalDue);
  };

  return (
    <div
      ref={popoverRef}
      className="w-[300px] bg-[#282e33] rounded-lg shadow-2xl border border-[#454f59] z-50 text-[#b6c2cf] flex flex-col animate-in fade-in zoom-in duration-100 font-sans relative max-h-[80vh] overflow-y-auto"
    >
      <div className="flex justify-between items-center p-3 border-b border-[#3b444c]">
        <h3 className="font-semibold text-sm w-full text-center text-white">Dates</h3>
        <button onClick={onClose} className="p-1 hover:bg-[#3b444c] rounded text-white absolute right-2">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Navigation */}
        <div className="flex justify-between items-center px-1">
          <div className="flex gap-1">
            <button onClick={handlePrevYear} className="p-1 hover:bg-white/5 rounded cursor-pointer text-white transition-colors"><ChevronsLeft size={16} /></button>
            <button onClick={handlePrevMonth} className="p-1 hover:bg-white/5 rounded cursor-pointer text-white transition-colors"><ChevronLeft size={16} /></button>
          </div>
          <span className="text-sm font-bold text-white">{monthName} {year}</span>
          <div className="flex gap-1">
            <button onClick={handleNextMonth} className="p-1 hover:bg-white/5 rounded cursor-pointer text-white transition-colors"><ChevronRight size={16} /></button>
            <button onClick={handleNextYear} className="p-1 hover:bg-white/5 rounded cursor-pointer text-white transition-colors"><ChevronsRight size={16} /></button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-[11px] font-bold text-white/70 py-1">{d}</div>
          ))}
          {daysInMonth.map((d, i) => {
            const isToday = d.date.toDateString() === now.toDateString();
            const isStart = startDate && d.date.toDateString() === startDate.toDateString();
            const isDue = dueDate && d.date.toDateString() === dueDate.toDateString();
            const isSelected = (activeInput === 'start' && isStart) || (activeInput === 'due' && isDue);
            
            return (
              <div
                key={i}
                onClick={() => handleDateSelect(d.date)}
                className={`
                  text-xs py-2 rounded-sm cursor-pointer transition-colors relative
                  ${d.current ? 'text-white' : 'text-white/40'}
                  ${isSelected ? 'bg-[#579dff] text-[#1d2125] font-bold z-10' : ''}
                  ${!isSelected && (isStart || isDue) ? 'border border-[#579dff]' : ''}
                  ${!isSelected ? 'hover:bg-white/5' : ''}
                `}
              >
                {d.day}
                {isToday && !isSelected && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#579dff] rounded-full"></div>}
              </div>
            );
          })}
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-3.5 pt-2 border-t border-[#3b444c]">
          {/* Start Date */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wide text-white/70">Start date</h4>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  readOnly
                  placeholder="M/D/YYYY"
                  onClick={() => setActiveInput('start')}
                  value={startDate ? startDate.toLocaleDateString() : ""}
                  className={`w-full bg-[#22272b] border ${activeInput === 'start' ? 'border-[#579dff] ring-1 ring-[#579dff]' : 'border-[#3b444c]'} rounded px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer transition-all`}
                />
                {startDate && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setStartDate(null); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wide text-white/70">Due date</h4>
            <div className="flex items-center gap-2">
              <div className="flex gap-2 flex-1">
                <div className="flex-[1.2] relative">
                  <input 
                    type="text" 
                    readOnly
                    placeholder="M/D/YYYY"
                    onClick={() => setActiveInput('due')}
                    value={dueDate ? dueDate.toLocaleDateString() : ""}
                    className={`w-full bg-[#22272b] border ${activeInput === 'due' ? 'border-[#579dff] ring-1 ring-[#579dff]' : 'border-[#3b444c]'} rounded px-2 py-1.5 text-xs text-white outline-none cursor-pointer transition-all`}
                  />
                  {dueDate && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDueDate(null); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <div className={`flex flex-1 items-stretch bg-[#22272b] border rounded transition-all ${activeInput === 'due' ? 'border-[#579dff]' : 'border-[#3b444c] hover:border-[#454f59]'}`}>
                  <input 
                    type="text" 
                    value={timeInput}
                    onChange={e => setTimeInput(e.target.value)}
                    placeholder="12:00"
                    className="w-full min-w-0 bg-transparent border-none px-2 py-1.5 text-xs text-white outline-none"
                  />
                  <select
                    value={amPm}
                    onChange={e => setAmPm(e.target.value as 'AM' | 'PM')}
                    className="bg-transparent border-none border-l border-[#3b444c] px-1 text-[10px] text-white outline-none cursor-pointer hover:bg-[#2c333a] transition-colors"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 mt-1">
          <button 
            onClick={handleSave}
            className="w-full bg-[#579dff] hover:bg-[#85b8ff] text-[#1d2125] py-2 rounded text-sm font-semibold transition-colors"
          >
            Save
          </button>
          <button 
            onClick={() => { onSave(null, null); onClose(); }}
            className="w-full bg-[#3b444c] hover:bg-[#454f59] text-white py-2 rounded text-sm font-bold transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
