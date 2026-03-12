"use client";

import { useState } from "react";
import CreateBoardModal from "./CreateBoardModal";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BoardSwitcher({ boards, activeBoardId }: { boards: {id: number, title: string}[], activeBoardId: number }) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative group">
        <select 
          className="bg-white/20 hover:bg-white/30 text-white font-bold text-lg rounded px-2 py-1 outline-none cursor-pointer border-none appearance-none pr-8"
          value={activeBoardId}
          onChange={(e) => {
            router.push(`/boards/${e.target.value}`);
          }}
        >
          {boards.map(b => (
            <option key={b.id} value={b.id} className="text-black font-normal text-base">{b.title}</option>
          ))}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/70">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
      
      <button 
        onClick={() => setShowCreateModal(true)}
        className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded transition-colors"
        title="Create new board"
      >
        <Plus size={20} />
      </button>

      {showCreateModal && <CreateBoardModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}

