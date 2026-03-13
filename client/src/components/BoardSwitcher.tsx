"use client";

import { useState, useRef, useEffect } from "react";
import CreateBoardModal from "./CreateBoardModal";
import { Plus, ChevronDown, Check } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BoardSwitcher({ boards, activeBoardId }: { boards: {id: number, title: string}[], activeBoardId: number }) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeBoard = boards.find(b => b.id === activeBoardId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative" ref={containerRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-[#22272b] hover:bg-[#2c333a] text-white font-bold text-lg rounded px-3 py-1 border border-white/20 transition-colors focus:border-white/40 shadow-sm"
        >
          <span>{activeBoard?.title || "Select Board"}</span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-[#282e33] border border-[#3b444c] rounded-lg shadow-xl z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-3 py-2 text-[11px] font-bold text-white/50 uppercase tracking-wide">Your Boards</div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {boards.map(b => (
                <button
                  key={b.id}
                  onClick={() => {
                    router.push(`/boards/${b.id}`);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm text-white hover:bg-[#3b444c] transition-colors ${b.id === activeBoardId ? 'bg-[#579dff]/10' : ''}`}
                >
                  <span className={b.id === activeBoardId ? 'font-bold' : ''}>{b.title}</span>
                  {b.id === activeBoardId && <Check size={14} className="text-[#579dff]" />}
                </button>
              ))}
            </div>
            <div className="border-t border-[#3b444c] mt-1 pt-1">
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-[#3b444c] transition-colors"
              >
                <Plus size={14} />
                <span>Create new board</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      <button 
        onClick={() => setShowCreateModal(true)}
        className="p-1.5 bg-white/5 hover:bg-white/10 text-white rounded transition-colors border border-white/20 hover:border-white/40"
        title="Create new board"
      >
        <Plus size={20} />
      </button>

      {showCreateModal && <CreateBoardModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}

