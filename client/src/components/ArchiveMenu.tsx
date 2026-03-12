"use client";

import { useEffect, useState, useRef } from "react";
import { X, Archive, RotateCcw, Trash2 } from "lucide-react";
import { apiUrl } from "@/lib/utils";
import ConfirmPopover from "./ConfirmPopover";

interface ArchivedCard {
  id: number;
  title: string;
  list_title: string;
}

interface ArchiveMenuProps {
  boardId: number;
  onClose: () => void;
  onRestore: (card: any) => void;
  onDelete: (cardId: number) => void;
}

export default function ArchiveMenu({ boardId, onClose, onRestore, onDelete }: ArchiveMenuProps) {
  const [archivedCards, setArchivedCards] = useState<ArchivedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(apiUrl(`boards/${boardId}/archived`))
      .then(res => res.json())
      .then(data => {
        setArchivedCards(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching archived cards:", err);
        setLoading(false);
      });
  }, [boardId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleRestore = async (card: ArchivedCard) => {
    const res = await fetch(apiUrl(`cards/${card.id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_archived: false }),
    });
    if (res.ok) {
      const updatedCard = await res.json();
      setArchivedCards(prev => prev.filter(c => c.id !== card.id));
      onRestore(updatedCard);
    }
  };

  const handleDelete = async (cardId: number) => {
    const res = await fetch(apiUrl(`cards/${cardId}`), { method: "DELETE" });
    if (res.ok) {
      setArchivedCards(prev => prev.filter(c => c.id !== cardId));
      onDelete(cardId);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[340px] bg-[#f4f5f7] shadow-2xl z-[70] flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-200" ref={menuRef}>
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="font-semibold text-[#172b4d] flex items-center gap-2">
          <Archive size={18} /> Archived Items
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-600">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : archivedCards.length === 0 ? (
          <div className="text-center text-gray-500 py-8 flex flex-col items-center gap-2">
            <Archive size={40} className="opacity-20" />
            <p className="text-sm">No archived items found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {archivedCards.map(card => (
              <div key={card.id} className="bg-white p-3 rounded shadow-sm border border-gray-100 flex flex-col gap-2">
                <div className="text-sm font-medium text-[#172b4d]">{card.title}</div>
                <div className="text-[11px] text-gray-500">From list: <span className="font-semibold">{card.list_title}</span></div>
                <div className="flex gap-2 mt-1">
                  <button 
                    onClick={() => handleRestore(card)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#172b4d] hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                  >
                    <RotateCcw size={12} /> Send to board
                  </button>
                  <button 
                    onClick={() => setConfirmDeleteId(card.id)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDeleteId && (
        <ConfirmPopover 
          title="Delete card?"
          message="All actions will be removed from the activity feed and you won't be able to re-open the card. There is no undo."
          confirmLabel="Delete forever"
          onConfirm={() => handleDelete(confirmDeleteId)}
          onClose={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
