"use client";
import { useState } from "react";
import { CheckSquare, X } from "lucide-react";

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
}

export default function ChecklistSection({ 
  checklists, 
  onToggleItem, 
  onAddItem, 
  onUpdateTitle 
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
          <CheckSquare className="mt-1 flex-shrink-0" size={24} />
          <div className="flex-1">
            {editingChecklistId === cl.id ? (
              <input 
                autoFocus
                className="text-lg font-semibold bg-white border-2 border-blue-500 rounded px-2 py-0.5 w-full outline-none mb-3"
                value={tempTitle}
                onChange={e => setTempTitle(e.target.value)}
                onBlur={() => { onUpdateTitle(cl.id, tempTitle); setEditingChecklistId(null); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') { onUpdateTitle(cl.id, tempTitle); setEditingChecklistId(null); }
                  if (e.key === 'Escape') setEditingChecklistId(null);
                }}
              />
            ) : (
              <h3 
                className="font-semibold text-lg mb-3 cursor-pointer hover:bg-black/5 px-1 rounded transition-colors -ml-1"
                onClick={() => {
                  setEditingChecklistId(cl.id);
                  setTempTitle(cl.title);
                }}
              >
                {cl.title}
              </h3>
            )}
            
            <div className="flex flex-col gap-2.5">
              {cl.items?.map((item) => (
                <label key={item.id} className="flex items-center gap-3 bg-white p-2 rounded shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={!!item.is_completed} 
                    onChange={() => onToggleItem(cl.id, item.id, item.is_completed)}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer" 
                  />
                  <span className={!!item.is_completed ? "line-through text-gray-400" : "text-[#172b4d]"}>{item.title}</span>
                </label>
              ))}
              
              {addingItemTo === cl.id ? (
                <div className="mt-2 flex flex-col gap-2">
                  <input 
                    autoFocus
                    type="text" 
                    value={newItemTitle}
                    onChange={e => setNewItemTitle(e.target.value)}
                    placeholder="Add an item"
                    className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:border-blue-500 transition-colors text-[#172b4d]"
                    onKeyDown={e => {
                      if (e.key === 'Enter') { onAddItem(cl.id, newItemTitle); setNewItemTitle(""); setAddingItemTo(null); }
                      if (e.key === 'Escape') setAddingItemTo(null);
                    }}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { onAddItem(cl.id, newItemTitle); setNewItemTitle(""); setAddingItemTo(null); }} className="bg-[#0079bf] hover:bg-[#026aa7] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">Add</button>
                    <button onClick={() => setAddingItemTo(null)} className="px-2 py-1.5 hover:bg-black/10 text-[#172b4d] rounded transition-colors text-sm font-medium">Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="bg-gray-200/80 hover:bg-gray-300 px-3 py-1.5 rounded-md mt-2 text-sm w-fit font-medium transition-colors text-left text-[#172b4d]"
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
