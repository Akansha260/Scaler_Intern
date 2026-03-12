"use client";

import { X, User as UserIcon, Calendar, Clock, Tag } from "lucide-react";
import { Label, User } from "@/types";
import { Dispatch, SetStateAction, useEffect, useRef } from "react";

export interface FilterState {
  keyword: string;
  noMembers: boolean;
  members: number[];
  noLabels: boolean;
  labels: number[];
  noDueDate: boolean;
  overdue: boolean;
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
      className="absolute top-10 left-0 w-[340px] bg-[#282e33] rounded-lg shadow-xl border border-[#3b444c] z-50 text-[#b6c2cf] flex flex-col max-h-[80vh]"
    >

      {/* Header */}
      <div className="flex justify-between items-center p-3 shrink-0">
        <h3 className="font-semibold text-sm w-full text-center">Filter</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[#3b444c] rounded-md absolute right-2 text-[#9fadbc]"
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

          <p className="text-[11px] text-[#8c9bab] mt-1">
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
                  className="h-6 flex-1 rounded"
                  style={{ backgroundColor: label.color }}
                />

              </label>
            ))}
          </div>
        </div>

        {/* Due Date */}
        <div>

          <h4 className="text-xs font-semibold tracking-wide mb-2">Due Date</h4>

          <div className="flex flex-col gap-2">

            <label className="flex items-center gap-3 cursor-pointer hover:bg-[#3b444c] p-1 rounded">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#579dff]"
                checked={filter.noDueDate}
                onChange={() =>
                  setFilter(prev => ({
                    ...prev,
                    noDueDate: !prev.noDueDate,
                  }))
                }
              />
              <Calendar size={14} />
              <span className="text-sm">No dates</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer hover:bg-[#3b444c] p-1 rounded">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#579dff]"
                checked={filter.overdue}
                onChange={() =>
                  setFilter(prev => ({
                    ...prev,
                    overdue: !prev.overdue,
                  }))
                }
              />
              <Clock size={14} />
              <span className="text-sm">Overdue</span>
            </label>

          </div>
        </div>

      </div>
    </div>
  );
}