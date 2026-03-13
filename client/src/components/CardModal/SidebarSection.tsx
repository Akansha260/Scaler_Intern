"use client";
import { User, Tag, Clock, Trash2, X, Calendar, Archive } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import DatePickerPopover from "../DatePickerPopover";

interface SidebarSectionProps {
  card: any;
  allUsers: any[];
  allLabels: any[];
  startDate?: string;
  dueDate?: string;
  showMemberPopover: boolean;
  setShowMemberPopover: (show: boolean) => void;
  showLabelPopover: boolean;
  setShowLabelPopover: (show: boolean) => void;
  onToggleMember: (userId: number) => void;
  onToggleLabel: (labelId: number) => void;
  onDatesChange: (startDate: string | null, dueDate: string | null) => void;
  onArchive: () => void;
  onDelete: () => void;
  onCreateUser: (name: string) => void;
}

export default function SidebarSection({
  card,
  allUsers,
  allLabels,
  dueDate,
  startDate,
  showMemberPopover,
  setShowMemberPopover,
  showLabelPopover,
  setShowLabelPopover,
  onToggleMember,
  onToggleLabel,
  onDatesChange,
  onArchive,
  onDelete,
  onCreateUser,
}: SidebarSectionProps) {
  const [showDatePopover, setShowDatePopover] = useState(false);
  const memberPopoverRef = useRef<HTMLDivElement>(null);
  const labelPopoverRef = useRef<HTMLDivElement>(null);
  const [colorblindMode, setColorblindMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('colorblindMode') === 'true';
    if (saved) setColorblindMode(true);
  }, []);

  const toggleColorblindMode = () => {
    const newVal = !colorblindMode;
    setColorblindMode(newVal);
    localStorage.setItem('colorblindMode', String(newVal));
    window.dispatchEvent(new Event('storage')); // Notify other components
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMemberPopover && memberPopoverRef.current && !memberPopoverRef.current.contains(event.target as Node)) {
        setShowMemberPopover(false);
      }
      if (showLabelPopover && labelPopoverRef.current && !labelPopoverRef.current.contains(event.target as Node)) {
        setShowLabelPopover(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMemberPopover, showLabelPopover, setShowMemberPopover, setShowLabelPopover]);

  const getTimeStatus = () => {
    if (card.is_completed) return { label: 'COMPLETE', color: 'bg-[#1f845a] text-white' };
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    if (due < now) return { label: 'OVERDUE', color: 'bg-red-500 text-white' };
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (due <= in24Hours) return { label: 'DUE SOON', color: 'bg-[#f5cd47] text-[#172b4d]' };
    return null;
  };

  const status = getTimeStatus();

  return (
    <div className="w-44 flex flex-col gap-2">
      <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 mt-10">Add to card</h4>
      
      <div className="relative" ref={memberPopoverRef}>
        <button className="bg-gray-200/80 hover:bg-gray-300 w-full px-3 py-1.5 rounded-md text-sm flex items-center gap-2 text-[#172b4d] font-medium transition-colors" onClick={() => setShowMemberPopover(!showMemberPopover)}><User size={16}/> Members</button>
        {showMemberPopover && (
          <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded shadow-xl z-20 p-2 animate-in fade-in zoom-in duration-100 origin-top-right">
            <div className="flex justify-between items-center mb-2 pb-2 border-b"><h4 className="font-semibold text-sm w-full text-center">Members</h4><button onClick={() => setShowMemberPopover(false)}><X size={14}/></button></div>
            <div className="flex flex-col gap-2">
              {allUsers.map(u => {
                const isSelected = card.members?.some((m: any) => m.id === u.id);
                return (
                  <label key={u.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-100 rounded">
                    <input type="checkbox" checked={!!isSelected} onChange={() => onToggleMember(u.id)} className="w-4 h-4 cursor-pointer accent-[#0079bf]" />
                    <div className="w-6 h-6 rounded-full bg-[#0052cc] text-white flex items-center justify-center text-xs font-bold">{u.name[0]?.toUpperCase()}</div>
                    <span className="text-sm">{u.name}</span>
                  </label>
                );
              })}
              <div className="mt-2 border-t pt-2">
                <form onSubmit={(e) => { e.preventDefault(); const input = (e.target as any).userName; if (input.value) { onCreateUser(input.value); input.value = ''; } }}>
                  <input 
                    name="userName"
                    type="text" 
                    placeholder="New user name..." 
                    className="w-full border border-gray-300 p-1.5 text-sm rounded mb-2 outline-none text-black"
                  />
                  <button 
                    type="submit"
                    className="w-full bg-[#0079bf] hover:bg-[#026aa7] text-white text-xs py-1.5 font-medium rounded transition-colors"
                  >
                    Create User
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative" ref={labelPopoverRef}>
        <button className="bg-gray-200/80 hover:bg-gray-300 w-full px-3 py-1.5 rounded-md text-sm flex items-center gap-2 text-[#172b4d] font-medium transition-colors" onClick={() => setShowLabelPopover(!showLabelPopover)}><Tag size={16}/> Labels</button>
        {showLabelPopover && (
          <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded shadow-xl z-20 p-2 animate-in fade-in zoom-in duration-100 origin-top-right">
            <div className="flex justify-between items-center mb-2 pb-2 border-b"><h4 className="font-semibold text-sm w-full text-center">Labels</h4><button onClick={() => setShowLabelPopover(false)}><X size={14}/></button></div>
            <div className="flex flex-col gap-2">
              {allLabels.map(l => {
                const isSelected = card.labels?.some((lbl: any) => lbl.id === l.id);
                const getPatternClass = (color: string) => {
                  if (color.toLowerCase().includes('green') || color === '#4bce97') return 'pattern-diagonal';
                  if (color.toLowerCase().includes('yellow') || color === '#f5cd47') return 'pattern-dots';
                  if (color.toLowerCase().includes('orange') || color === '#fea362') return 'pattern-waves';
                  if (color.toLowerCase().includes('red') || color === '#f87168') return 'pattern-lines';
                  if (color.toLowerCase().includes('blue') || color === '#579dff') return 'pattern-vertical';
                  return '';
                };
                return (
                  <label key={l.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-100 rounded group">
                    <input type="checkbox" checked={!!isSelected} onChange={() => onToggleLabel(l.id)} className="w-4 h-4 cursor-pointer accent-[#0079bf] shrink-0" />
                    <div 
                      className={`h-8 flex-1 rounded transition-all group-hover:brightness-90 ${colorblindMode ? getPatternClass(l.color) : ''}`} 
                      style={{ backgroundColor: l.color }}
                    ></div>
                  </label>
                );
              })}
              <div className="mt-2 border-t pt-2">
                <button 
                  onClick={toggleColorblindMode}
                  className="w-full text-left px-2 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded flex items-center justify-between transition-colors"
                >
                  Enable colorblind friedly mode
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${colorblindMode ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${colorblindMode ? 'left-4.5' : 'left-0.5'}`}></div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <button 
           className="bg-gray-200/80 hover:bg-gray-300 w-full px-3 py-1.5 rounded-md text-sm flex flex-col items-start gap-1 text-[#172b4d] font-medium transition-colors relative group"
           onClick={() => setShowDatePopover(!showDatePopover)}
        >
           <div className="flex items-center gap-2 w-full">
             <Clock size={16} className="flex-shrink-0" />
             <span className="truncate">
               {dueDate || startDate ? (
                 <>
                   {startDate && new Date(startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                   {startDate && dueDate && " - "}
                   {dueDate && new Date(dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                   {dueDate && (
                     new Date(dueDate).toISOString().split('T')[1].startsWith('00:00') === false && 
                     `, ${new Date(dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                   )}
                 </>
               ) : "Dates"}
             </span>
           </div>
           {status && (
             <div className={`${status.color} text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mt-0.5 ml-6`}>
               {status.label}
             </div>
           )}
        </button>
        {showDatePopover && (
          <DatePickerPopover 
            initialStartDate={startDate}
            initialDueDate={dueDate}
            onSave={(start, due) => { onDatesChange(start, due); setShowDatePopover(false); }}
            onClose={() => setShowDatePopover(false)}
          />
        )}
      </div>
      
      <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 mt-4">Actions</h4>
      <button 
        className="bg-gray-200/80 hover:bg-gray-300 w-full px-3 py-1.5 rounded-md text-sm flex items-center gap-2 text-[#172b4d] font-medium transition-colors"
        onClick={onArchive}
      >
        <Archive size={16}/> Archive
      </button>
      
      <button 
        className="bg-red-50 hover:bg-red-100 w-full px-3 py-1.5 rounded-md text-sm flex items-center gap-2 text-red-700 font-medium transition-colors mt-2"
        onClick={onDelete}
      >
        <Trash2 size={16}/> Delete
      </button>
    </div>
  );
}
