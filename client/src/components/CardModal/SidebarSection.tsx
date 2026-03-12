"use client";
import { User, Tag, Clock, Trash2, X } from "lucide-react";
import { useRef } from "react";

interface SidebarSectionProps {
  card: any;
  allUsers: any[];
  allLabels: any[];
  dueDate: string;
  showMemberPopover: boolean;
  setShowMemberPopover: (show: boolean) => void;
  showLabelPopover: boolean;
  setShowLabelPopover: (show: boolean) => void;
  onToggleMember: (userId: number) => void;
  onToggleLabel: (labelId: number) => void;
  onDateChange: (date: string) => void;
  onArchive: () => void;
  onDelete: () => void;
  onCreateUser: (name: string) => void;
}

export default function SidebarSection({
  card,
  allUsers,
  allLabels,
  dueDate,
  showMemberPopover,
  setShowMemberPopover,
  showLabelPopover,
  setShowLabelPopover,
  onToggleMember,
  onToggleLabel,
  onDateChange,
  onArchive,
  onDelete,
  onCreateUser,
}: SidebarSectionProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-44 flex flex-col gap-2">
      <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 mt-10">Add to card</h4>
      
      <div className="relative">
        <button className="bg-gray-200/80 hover:bg-gray-300 w-full px-3 py-1.5 rounded-md text-sm flex items-center gap-2 text-[#172b4d] font-medium transition-colors" onClick={() => setShowMemberPopover(!showMemberPopover)}><User size={16}/> Members</button>
        {showMemberPopover && (
          <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded shadow-xl z-20 p-2">
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

      <div className="relative">
        <button className="bg-gray-200/80 hover:bg-gray-300 w-full px-3 py-1.5 rounded-md text-sm flex items-center gap-2 text-[#172b4d] font-medium transition-colors" onClick={() => setShowLabelPopover(!showLabelPopover)}><Tag size={16}/> Labels</button>
        {showLabelPopover && (
          <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded shadow-xl z-20 p-2">
            <div className="flex justify-between items-center mb-2 pb-2 border-b"><h4 className="font-semibold text-sm w-full text-center">Labels</h4><button onClick={() => setShowLabelPopover(false)}><X size={14}/></button></div>
            <div className="flex flex-col gap-2">
              {allLabels.map(l => {
                const isSelected = card.labels?.some((lbl: any) => lbl.id === l.id);
                return (
                  <label key={l.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-100 rounded">
                    <input type="checkbox" checked={!!isSelected} onChange={() => onToggleLabel(l.id)} className="w-4 h-4 cursor-pointer accent-[#0079bf] shrink-0" />
                    <div className="h-8 flex-1 rounded" style={{ backgroundColor: l.color }}></div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <label 
         className="relative flex w-full items-center gap-2 cursor-pointer bg-gray-200/80 hover:bg-gray-300 px-3 py-1.5 rounded-md text-sm text-[#172b4d] font-medium transition-colors overflow-hidden"
         onClick={(e) => { 
           e.preventDefault(); 
           try { dateInputRef.current?.showPicker(); } catch (e) { /* fallback */ }
         }}
      >
         <Clock size={16} className="flex-shrink-0" />
         <span className="truncate">{dueDate ? new Date(dueDate + 'T12:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }) : "Dates"}</span>
         <input ref={dateInputRef} type="date" value={dueDate || ""} onChange={(e) => onDateChange(e.target.value)} className="absolute opacity-0 w-[1px] h-[1px] top-0 left-0 -z-10" />
      </label>
      
      <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 mt-4">Actions</h4>
      <button 
        className="bg-gray-200/80 hover:bg-gray-300 w-full px-3 py-1.5 rounded-md text-sm flex items-center gap-2 text-[#172b4d] font-medium transition-colors"
        onClick={onArchive}
      >
        <Trash2 size={16}/> Archive
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
