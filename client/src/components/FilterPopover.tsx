"use client";

import { X, User as UserIcon, Calendar, Clock, Tag } from "lucide-react";
import { Label, User } from "@/types";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

export interface FilterState {
  keyword: string;
  noMembers: boolean;
  members: number[];
  noLabels: boolean;
  labels: number[];
  noDueDate: boolean;
  overdue: boolean;
  dueSoon: boolean;
  complete: boolean;
  incomplete: boolean;
}

interface FilterPopoverProps {
  filter: FilterState;
  setFilter: Dispatch<SetStateAction<FilterState>>;
  allLabels: Label[];
  allMembers: User[];
  onClose: () => void;
}

export default function FilterPopover({
  filter,
  setFilter,
  allLabels,
  allMembers,
  onClose
}: FilterPopoverProps) {

  const popoverRef = useRef<HTMLDivElement>(null);
  const [colorblindMode, setColorblindMode] = useState(false);

  useEffect(() => {
    const checkMode = () => {
      setColorblindMode(localStorage.getItem('colorblindMode') === 'true');
    };
    checkMode();
    window.addEventListener('storage', checkMode);
    return () => window.removeEventListener('storage', checkMode);
  }, []);

  const getPatternClass = (color: string) => {
    const c = color.toLowerCase();
    if (c.includes('green') || c === '#4bce97' || c === '#1f845a') return 'pattern-diagonal';
    if (c.includes('yellow') || c === '#f5cd47') return 'pattern-dots';
    if (c.includes('orange') || c === '#fea362') return 'pattern-waves';
    if (c.includes('red') || c === '#f87168' || c === '#ae2e24') return 'pattern-lines';
    if (c.includes('blue') || c === '#579dff' || c === '#0052cc') return 'pattern-vertical';
    if (c.includes('purple') || c.includes('violet') || c === '#9f8fef' || c === '#b658d7') return 'pattern-checkered';
    return '';
  };

  const toggleMember = (id: number) => {
    setFilter(prev => ({
      ...prev,
      members: prev.members.includes(id)
        ? prev.members.filter(m => m !== id)
        : [...prev.members, id]
    }));
  };

  const toggleLabel = (id: number) => {
    setFilter(prev => ({
      ...prev,
      labels: prev.labels.includes(id)
        ? prev.labels.filter(l => l !== id)
        : [...prev.labels, id]
    }));
  };

  useEffect(() => {

    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };

  }, [onClose]);

  return (
    <div
      ref={popoverRef}
      className="absolute top-10 right-0 w-[340px] bg-[#282e33] rounded-lg shadow-xl border border-[#3b444c] z-50 text-[#b6c2cf] flex flex-col max-h-[80vh]"
    >

      {/* Header */}
      <div className="flex justify-between items-center p-3 shrink-0">
        <h3 className="font-semibold text-sm w-full text-center text-white">Filter</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[#3b444c] rounded-md absolute right-2 text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4 pt-1 overflow-y-auto custom-scrollbar flex flex-col gap-5">

        {/* Keyword */}
        <div>
          <h4 className="text-xs font-semibold tracking-wide mb-2">Keyword</h4>

          <input
            type="text"
            placeholder="Enter a keyword..."
            className="w-full bg-[#22272b] border border-[#3b444c] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#85b8ff]"
            value={filter.keyword}
            onChange={e =>
              setFilter(prev => ({ ...prev, keyword: e.target.value }))
            }
          />

          <p className="text-[11px] text-white/50 mt-1">
            Search cards, members, labels and more
          </p>
        </div>

        {/* Members */}
        <div>
          <h4 className="text-xs font-semibold tracking-wide mb-2">Members</h4>

          <div className="flex flex-col gap-2">

            <label className="flex items-center gap-3 cursor-pointer hover:bg-[#3b444c] p-1 rounded">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#579dff]"
                checked={filter.noMembers}
                onChange={() =>
                  setFilter(prev => ({
                    ...prev,
                    noMembers: !prev.noMembers
                  }))
                }
              />

              <div className="w-6 h-6 rounded-full bg-[#3b444c] flex items-center justify-center">
                <UserIcon size={14} />
              </div>

              <span className="text-sm">No members</span>
            </label>

            {allMembers.map(member => (
              <label
                key={member.id}
                className="flex items-center gap-3 cursor-pointer hover:bg-[#3b444c] p-1 rounded"
              >

                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[#579dff]"
                  checked={filter.members.includes(member.id)}
                  onChange={() => toggleMember(member.id)}
                />

                <div className="w-6 h-6 rounded-full bg-[#0052cc] flex items-center justify-center text-white text-xs font-bold">
                  {member.name.charAt(0).toUpperCase()}
                </div>

                <span className="text-sm">{member.name}</span>

              </label>
            ))}
          </div>
        </div>

        {/* Labels */}
        <div>

          <h4 className="text-xs font-semibold tracking-wide mb-2">Labels</h4>

          <div className="flex flex-col gap-2">

            <label className="flex items-center gap-3 cursor-pointer hover:bg-[#3b444c] p-1 rounded">

              <input
                type="checkbox"
                className="w-4 h-4 accent-[#579dff]"
                checked={filter.noLabels}
                onChange={() =>
                  setFilter(prev => ({
                    ...prev,
                    noLabels: !prev.noLabels
                  }))
                }
              />

              <div className="w-6 h-6 rounded-full bg-[#3b444c] flex items-center justify-center">
                <Tag size={12} />
              </div>

              <span className="text-sm">No labels</span>

            </label>

            {allLabels.map(label => (
              <label
                key={label.id}
                className="flex items-center gap-3 cursor-pointer hover:bg-[#3b444c] p-1 rounded"
              >

                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[#579dff]"
                  checked={filter.labels.includes(label.id)}
                  onChange={() => toggleLabel(label.id)}
                />

                <div
                  className={`h-6 flex-1 rounded transition-all ${colorblindMode ? getPatternClass(label.color) : ''}`}
                  style={{ backgroundColor: label.color }}
                  title={label.name}
                />

              </label>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-[#3b444c]">
            <button
              onClick={() => {
                const next = !colorblindMode;
                setColorblindMode(next);
                localStorage.setItem('colorblindMode', String(next));
                window.dispatchEvent(new Event('storage'));
              }}
              className="w-full text-left px-2 py-1.5 hover:bg-[#3b444c] rounded text-[11px] font-medium text-white flex items-center justify-between"
            >
              Colorblind friendly patterns
              <div className={`w-7 h-3.5 rounded-full relative transition-colors ${colorblindMode ? 'bg-[#1f845a]' : 'bg-[#454f59]'}`}>
                <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all ${colorblindMode ? 'left-[16px]' : 'left-0.5'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Status */}
        <div>
          <h4 className="text-xs font-semibold tracking-wide mb-2 uppercase text-white/50">Status</h4>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-3 cursor-pointer hover:bg-[#3b444c] p-1.5 rounded transition-colors group">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#579dff] cursor-pointer"
                checked={filter.complete}
                onChange={() => setFilter(prev => ({ ...prev, complete: !prev.complete }))}
              />
              <span className="text-sm">Complete</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer hover:bg-[#3b444c] p-1.5 rounded transition-colors group">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#579dff] cursor-pointer"
                checked={filter.incomplete}
                onChange={() => setFilter(prev => ({ ...prev, incomplete: !prev.incomplete }))}
              />
              <span className="text-sm">Incomplete</span>
            </label>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <h4 className="text-xs font-semibold tracking-wide mb-2 uppercase text-white/50">Due Date</h4>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-3 cursor-pointer hover:bg-[#3b444c] p-1.5 rounded transition-colors group">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#579dff] cursor-pointer"
                checked={filter.noDueDate}
                onChange={() => setFilter(prev => ({ ...prev, noDueDate: !prev.noDueDate }))}
              />
              <Calendar size={14} className="text-white/50" />
              <span className="text-sm text-white">No dates</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer hover:bg-[#3b444c] p-1.5 rounded transition-colors group">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#579dff] cursor-pointer"
                checked={filter.overdue}
                onChange={() => setFilter(prev => ({ ...prev, overdue: !prev.overdue }))}
              />
              <Clock size={14} className="text-red-400" />
              <span className="text-sm text-white">Overdue</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer hover:bg-[#3b444c] p-1.5 rounded transition-colors group">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#579dff] cursor-pointer"
                checked={filter.dueSoon}
                onChange={() => setFilter(prev => ({ ...prev, dueSoon: !prev.dueSoon }))}
              />
              <Clock size={14} className="text-[#f5cd47]" />
              <span className="text-sm text-white">Due in the next 24 hours</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}