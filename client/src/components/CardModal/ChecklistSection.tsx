"use client";
import { useState } from "react";
import { CheckSquare, X, Trash2 } from "lucide-react";

interface ChecklistItem {
  id: number;
  title: string;
  is_completed: boolean;
  position: number;
}

interface Checklist {
  id: number;
  title: string;
  items: ChecklistItem[];
}

interface ChecklistSectionProps {
  checklists: Checklist[];
  onToggleItem: (checklistId: number, itemId: number, currentStatus: boolean) => void;
  onAddItem: (checklistId: number, title: string) => void;
  onUpdateTitle: (checklistId: number, title: string) => void;
  onDeleteItem: (checklistId: number, itemId: number) => void;
  onDeleteChecklist: (checklistId: number) => void;
}

export default function ChecklistSection({ 
  checklists, 
  onToggleItem, 
  onAddItem, 
  onUpdateTitle,
  onDeleteItem,
  onDeleteChecklist
}: ChecklistSectionProps) {
  const [addingItemTo, setAddingItemTo] = useState<number | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [editingChecklistId, setEditingChecklistId] = useState<number | null>(null);
  const [tempTitle, setTempTitle] = useState("");

  if (!checklists || checklists.length === 0) return null;

  return (
    <div className="flex flex-col gap-8">
      {checklists.map((cl) => (
        <div key={cl.id} className="flex gap-4">
          <CheckSquare className="mt-1 flex-shrink-0 text-white" size={24} />
          <div className="flex-1">
            {editingChecklistId === cl.id ? (
              <input 
                autoFocus
                className="text-lg font-semibold bg-[#161a1d] border-2 border-[#579dff] rounded px-2 py-0.5 w-full outline-none mb-3 text-white"
                value={tempTitle}
                onChange={e => setTempTitle(e.target.value)}
                onBlur={() => { onUpdateTitle(cl.id, tempTitle); setEditingChecklistId(null); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') { onUpdateTitle(cl.id, tempTitle); setEditingChecklistId(null); }
                  if (e.key === 'Escape') setEditingChecklistId(null);
                }}
              />
            ) : (
              <div className="flex items-center gap-3 mb-3 w-full">
                <h3 
                  className="font-semibold text-lg cursor-pointer hover:bg-white/5 px-1 rounded transition-colors -ml-1 text-white"
                  onClick={() => {
                    setEditingChecklistId(cl.id);
                    setTempTitle(cl.title);
                  }}
                >
                  {cl.title}
                </h3>
                <div className="flex items-center gap-1.5 text-white text-sm font-medium bg-white/5 px-2 py-0.5 rounded">
                  <CheckSquare size={14} className="text-white" />
                  <span>
                    {cl.items?.filter(i => i.is_completed).length || 0}/{cl.items?.length || 0}
                  </span>
                </div>
                <button 
                  onClick={() => onDeleteChecklist(cl.id)}
                  className="p-1 hover:bg-red-900/20 text-white hover:text-red-400 rounded transition-all ml-auto focus:outline-none"
                  title="Delete checklist"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
            
            <div className="flex flex-col gap-2.5">
              {cl.items?.map((item) => (
                <div key={item.id} className="group flex items-center gap-3 bg-[#22272b] p-2 rounded shadow-sm border border-[#3b444c] hover:bg-[#2c333a] transition-colors">
                  <input 
                    type="checkbox" 
                    checked={!!item.is_completed} 
                    onChange={() => onToggleItem(cl.id, item.id, item.is_completed)}
                    className="w-4 h-4 rounded border-[#454f59] cursor-pointer accent-[#579dff]" 
                  />
                  <span className={`flex-1 ${!!item.is_completed ? "line-through text-white/60" : "text-white"}`}>{item.title}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteItem(cl.id, item.id); }}
                    className="p-1 hover:bg-white/5 rounded text-white hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              
              {addingItemTo === cl.id ? (
                <div className="mt-2 flex flex-col gap-2">
                  <input 
                    autoFocus
                    type="text" 
                    value={newItemTitle}
                    onChange={e => setNewItemTitle(e.target.value)}
                    placeholder="Add an item"
                    className="w-full bg-[#161a1d] border border-[#454f59] p-2 text-sm rounded outline-none focus:ring-2 focus:ring-[#579dff] transition-colors text-white"
                    onKeyDown={e => {
                      if (e.key === 'Enter') { onAddItem(cl.id, newItemTitle); setNewItemTitle(""); setAddingItemTo(null); }
                      if (e.key === 'Escape') setAddingItemTo(null);
                    }}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { onAddItem(cl.id, newItemTitle); setNewItemTitle(""); setAddingItemTo(null); }} className="bg-[#579dff] hover:bg-[#85b8ff] text-[#1d2125] px-3 py-1.5 rounded text-sm font-bold transition-colors">Add</button>
                    <button onClick={() => setAddingItemTo(null)} className="px-2 py-1.5 hover:bg-white/5 text-white rounded transition-colors text-sm font-medium">Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md mt-2 text-sm w-fit font-medium transition-colors text-left text-white"
                  onClick={() => { setAddingItemTo(cl.id); setNewItemTitle(""); }}
                >
                  Add an item
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
