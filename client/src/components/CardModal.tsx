"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { X, AlignLeft, CheckSquare } from "lucide-react";
import { apiUrl } from "@/lib/utils";
import ConfirmPopover from "./ConfirmPopover";
import ChecklistSection from "./CardModal/ChecklistSection";
import SidebarSection from "./CardModal/SidebarSection";

export default function CardModal({
  cardId,
  boardId,
  onClose,
  onDelete,
  onUpdated,
}: {
  cardId: number;
  boardId: number;
  onClose: () => void;
  onDelete?: (listId: number) => void;
  onUpdated?: (card: any) => void;
}) {
  const [card, setCard] = useState<any>(null);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [dueDate, setDueDate] = useState("");
  
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allLabels, setAllLabels] = useState<any[]>([]);
  const [showMemberPopover, setShowMemberPopover] = useState(false);
  const [showLabelPopover, setShowLabelPopover] = useState(false);
  const [showChecklistPopover, setShowChecklistPopover] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("Checklist");
  
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch(apiUrl(`cards/${cardId}`))
      .then(res => res.json())
      .then(data => {
        setCard(data);
        setDescInput(data.description || "");
        setTitleInput(data.title || "");
        if (data.due_date) {
            const d = new Date(data.due_date);
            setDueDate(d.toISOString().split('T')[0]);
        }
      });
      
    fetch(apiUrl("users")).then(res => res.json()).then(setAllUsers).catch(console.error);
    fetch(apiUrl(`labels?boardId=${boardId}`)).then(res => res.json()).then(setAllLabels).catch(console.error);
  }, [cardId, boardId]);

  const saveCardAttribute = async (payload: any) => {
    const res = await fetch(apiUrl(`cards/${cardId}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const detailRes = await fetch(apiUrl(`cards/${cardId}`));
      if (detailRes.ok) {
        const updatedCard = await detailRes.json();
        setCard(updatedCard);
        if (onUpdated) onUpdated(updatedCard);
      }
    }
  };

  const handleToggleChecklist = async (checklistId: number, itemId: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    await fetch(apiUrl(`cards/${cardId}/checklist-items/${itemId}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_completed: newStatus }),
    });
    const res = await fetch(apiUrl(`cards/${cardId}`));
    const updatedCard = await res.json();
    setCard(updatedCard);
    if (onUpdated) onUpdated(updatedCard);
  };

  const handleCreateChecklist = async () => {
    if (!newChecklistTitle?.trim()) return;
    const res = await fetch(apiUrl(`cards/${cardId}/checklists`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newChecklistTitle.trim() }),
    });
    if (res.ok) {
      const res2 = await fetch(apiUrl(`cards/${cardId}`));
      const fullCard = await res2.json();
      setCard(fullCard);
      setShowChecklistPopover(false);
      setNewChecklistTitle("Checklist");
      if (onUpdated) onUpdated(fullCard);
    }
  };

  const handleAddChecklistItem = async (checklistId: number, title: string) => {
    if (!title?.trim()) return;
    const res = await fetch(apiUrl(`cards/${cardId}/checklists/${checklistId}/items`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    if (res.ok) {
      const res2 = await fetch(apiUrl(`cards/${cardId}`));
      const fullCard = await res2.json();
      setCard(fullCard);
      if (onUpdated) onUpdated(fullCard);
    }
  };

  const handleUpdateChecklistTitle = async (checklistId: number, title: string) => {
    if (!title?.trim()) return;
    const res = await fetch(apiUrl(`cards/${cardId}/checklists/${checklistId}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    if (res.ok) {
        saveCardAttribute({}); // Trigger refresh
    }
  };

  const handleToggleMember = async (userId: number) => {
    const hasMember = card.members?.find((m: any) => m.id === userId);
    if (hasMember) {
      await fetch(apiUrl(`cards/${cardId}/members/${userId}`), { method: 'DELETE' });
    } else {
      await fetch(apiUrl(`cards/${cardId}/members`), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId })
      });
    }
    const res = await fetch(apiUrl(`cards/${cardId}`));
    const updatedCard = await res.json();
    setCard(updatedCard);
    if (onUpdated) onUpdated(updatedCard);
  };

  const handleToggleLabel = async (labelId: number) => {
    const hasLabel = card.labels?.find((l: any) => l.id === labelId);
    if (hasLabel) {
      await fetch(apiUrl(`cards/${cardId}/labels/${labelId}`), { method: 'DELETE' });
    } else {
      await fetch(apiUrl(`cards/${cardId}/labels`), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label_id: labelId })
      });
    }
    const res = await fetch(apiUrl(`cards/${cardId}`));
    const updatedCard = await res.json();
    setCard(updatedCard);
    if (onUpdated) onUpdated(updatedCard);
  };

  const handleCreateUser = async (name: string) => {
    const res = await fetch(apiUrl("users"), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    const newUser = await res.json();
    setAllUsers(prev => [...prev, newUser]);
  };

  if (!card) return <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center"><div className="bg-white p-4 rounded text-black">Loading...</div></div>;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start pt-16 overflow-y-auto animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#f4f5f7] w-full max-w-3xl rounded-xl min-h-[500px] mb-16 relative flex p-6 gap-6 shadow-2xl animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <button className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-300 text-gray-600 transition-colors" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="flex-1 flex flex-col gap-8 text-[#172b4d]">
          <div className="flex gap-4 items-start">
             <div className="mt-1 flex-shrink-0 w-6"></div>
             {isEditingTitle ? (
               <input 
                 autoFocus
                 className="text-xl font-bold bg-white border-2 border-blue-500 rounded px-2 py-1 w-full outline-none"
                 value={titleInput}
                 onChange={e => setTitleInput(e.target.value)}
                 onBlur={() => { setIsEditingTitle(false); saveCardAttribute({ title: titleInput }); }}
                 onKeyDown={e => {
                   if (e.key === 'Enter') { setIsEditingTitle(false); saveCardAttribute({ title: titleInput }); }
                   if (e.key === 'Escape') { setTitleInput(card.title); setIsEditingTitle(false); }
                 }}
               />
             ) : (
               <h2 
                 className="text-xl font-bold cursor-pointer w-full hover:bg-black/5 px-2 py-1 rounded -ml-2 transition-colors"
                 onClick={() => setIsEditingTitle(true)}
               >
                 {card.title}
               </h2>
             )}
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  checked={!!card.is_completed}
                  onChange={() => saveCardAttribute({ is_completed: !card.is_completed })}
                  className="w-4 h-4 rounded cursor-pointer accent-green-500"
                />
                <span className="text-sm font-medium text-gray-600">Mark as complete</span>
              </div>
          </div>
          
          <div className="flex gap-4">
             <AlignLeft className="mt-1 flex-shrink-0" size={24} />
             <div className="flex-1">
               <h3 className="font-semibold text-lg mb-3">Description</h3>
               {isEditingDesc ? (
                 <div className="flex flex-col gap-2">
                    <textarea 
                      className="w-full bg-white border-none ring-2 ring-blue-500 rounded-md p-3 text-sm outline-none resize-none text-[#172b4d] min-h-[100px] shadow-sm"
                      autoFocus
                      value={descInput}
                      onChange={e => setDescInput(e.target.value)}
                      placeholder="Add a more detailed description..."
                    />
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setIsEditingDesc(false); saveCardAttribute({ description: descInput }); }} className="bg-[#0079bf] hover:bg-[#026aa7] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">Save</button>
                      <button onClick={() => { setIsEditingDesc(false); setDescInput(card.description || ""); }} className="px-2 py-1.5 hover:bg-black/10 text-[#172b4d] rounded transition-colors text-sm font-medium">Cancel</button>
                    </div>
                 </div>
               ) : (
                 <p 
                   className="text-[#172b4d] text-sm bg-gray-200/50 hover:bg-gray-300/60 p-3 rounded-lg leading-relaxed cursor-pointer transition-colors"
                   onClick={() => setIsEditingDesc(true)}
                 >
                   {card.description || "Add a more detailed description..."}
                 </p>
               )}
             </div>
          </div>

          <div className="relative mt-2 ml-10">
            <button
              className="bg-gray-200/80 hover:bg-gray-300 px-3 py-1.5 rounded-md text-sm flex items-center gap-2 text-[#172b4d] font-medium transition-colors w-fit"
              onClick={() => setShowChecklistPopover(!showChecklistPopover)}
            >
              <CheckSquare size={16}/> Add Checklist
            </button>
            {showChecklistPopover && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded shadow-xl z-20 p-2">
                <div className="flex justify-between items-center mb-2 pb-2 border-b"><h4 className="font-semibold text-sm w-full text-center text-black">Add checklist</h4><button onClick={() => setShowChecklistPopover(false)} className="text-black"><X size={14}/></button></div>
                <div className="flex flex-col gap-2">
                  <input type="text" autoFocus value={newChecklistTitle} onChange={e => setNewChecklistTitle(e.target.value)} className="w-full border p-1.5 text-sm rounded text-black" onKeyDown={e => e.key === 'Enter' && handleCreateChecklist()} />
                  <button onClick={handleCreateChecklist} className="w-full bg-[#0079bf] text-white py-1.5 text-xs font-medium rounded mt-2">Add</button>
                </div>
              </div>
            )}
          </div>

          <ChecklistSection 
            checklists={card.checklists}
            onToggleItem={handleToggleChecklist}
            onAddItem={handleAddChecklistItem}
            onUpdateTitle={handleUpdateChecklistTitle}
          />
        </div>

        <SidebarSection 
          card={card}
          allUsers={allUsers}
          allLabels={allLabels}
          dueDate={dueDate}
          showMemberPopover={showMemberPopover}
          setShowMemberPopover={setShowMemberPopover}
          showLabelPopover={showLabelPopover}
          setShowLabelPopover={setShowLabelPopover}
          onToggleMember={handleToggleMember}
          onToggleLabel={handleToggleLabel}
          onDateChange={(val) => { setDueDate(val); saveCardAttribute({ due_date: `${val}T12:00:00Z` }); }}
          onArchive={() => setShowArchiveConfirm(true)}
          onDelete={() => setShowDeleteConfirm(true)}
          onCreateUser={handleCreateUser}
        />
      </div>

      {showArchiveConfirm && (
        <ConfirmPopover 
          title="Archive card?"
          message="Are you sure you want to archive this card?"
          confirmLabel="Archive"
          onConfirm={() => { saveCardAttribute({ is_archived: true }); onClose(); }}
          onClose={() => setShowArchiveConfirm(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmPopover 
          title="Delete card?"
          message="Are you sure you want to delete this card forever?"
          confirmLabel="Delete forever"
          onConfirm={() => onDelete && onDelete(card.list_id)}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
