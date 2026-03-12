"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { X, AlignLeft, CheckSquare, Clock, Tag, User, Trash2 } from "lucide-react";
import { apiUrl } from "@/lib/utils";
import ConfirmPopover from "./ConfirmPopover";

export default function CardModal({
  cardId,
  onClose,
  onDelete,
  onUpdated,
}: {
  cardId: number;
  onClose: () => void;
  onDelete?: (listId: number) => void;
  onUpdated?: (card: any) => void;
}) {
  const router = useRouter();
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
  const [newUserName, setNewUserName] = useState("");
  const [newChecklistTitle, setNewChecklistTitle] = useState("Checklist");
  const [addingItemTo, setAddingItemTo] = useState<number | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);
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
    fetch(apiUrl("labels")).then(res => res.json()).then(setAllLabels).catch(console.error);
  }, [cardId]);

  const saveCardAttribute = async (payload: any) => {
    const res = await fetch(apiUrl(`cards/${cardId}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const updatedCard = await res.json();
      setCard(updatedCard);
      if (onUpdated) onUpdated(updatedCard);
    }
  };

  const handleSaveDesc = () => {
    setIsEditingDesc(false);
    saveCardAttribute({ description: descInput });
  };

  const handleSaveTitle = () => {
    if (!titleInput.trim()) {
      setTitleInput(card?.title);
      setIsEditingTitle(false);
      return;
    }
    setIsEditingTitle(false);
    saveCardAttribute({ title: titleInput });
  };

  const handleToggleChecklist = async (checklistId: number, itemId: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    setCard((prev: any) => ({
      ...prev,
      checklists: prev.checklists.map((cl: any) => 
        cl.id === checklistId 
          ? { ...cl, items: cl.items.map((it: any) => it.id === itemId ? { ...it, is_completed: newStatus } : it) }
          : cl
      )
    }));

    await fetch(apiUrl(`cards/${cardId}/checklist-items/${itemId}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_completed: newStatus }),
    });

    const res = await fetch(apiUrl(`cards/${cardId}`));
    const updatedCard = await res.json();
    setCard(updatedCard);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    setDueDate(dateVal);
    saveCardAttribute({ due_date: `${dateVal}T12:00:00Z` });
  };

  const toggleMember = async (userId: number) => {
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

  const handleCreateUser = async () => {
    if (!newUserName.trim()) return;
    const res = await fetch(apiUrl("users"), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newUserName })
    });
    const newUser = await res.json();
    setAllUsers(prev => [...prev, newUser]);
    setNewUserName("");
  };

  const toggleLabel = async (labelId: number) => {
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

  const handleCreateChecklist = async () => {
    const title = newChecklistTitle;
    if (!title || !title.trim()) return;

    const res = await fetch(apiUrl(`cards/${cardId}/checklists`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });

    if (!res.ok) return;

    const newChecklist = await res.json();
    const nextCard = {
      ...card,
      checklists: [...(card.checklists || []), { ...newChecklist, items: [] }],
    };
    setCard(nextCard);
    setShowChecklistPopover(false);
    setNewChecklistTitle("Checklist");
    if (onUpdated) onUpdated(nextCard);
  };

  const handleAddChecklistItemSubmit = async (checklistId: number) => {
    const title = newItemTitle;
    if (!title || !title.trim()) {
      setAddingItemTo(null);
      return;
    }

    const res = await fetch(apiUrl(`cards/${cardId}/checklists/${checklistId}/items`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });

    if (!res.ok) return;

    const newItem = await res.json();
    const nextCard = {
      ...card,
      checklists: card.checklists.map((cl: any) =>
        cl.id === checklistId
          ? { ...cl, items: [...(cl.items || []), newItem] }
          : cl
      ),
    };
    setCard(nextCard);
    setNewItemTitle("");
    setAddingItemTo(null);
    if (onUpdated) onUpdated(nextCard);
  };

  if (!card) return <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center"><div className="bg-white p-4 rounded text-black">Loading...</div></div>;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start pt-16 overflow-y-auto" onClick={onClose}>
      <div className="bg-[#f4f5f7] w-full max-w-3xl rounded-xl min-h-[500px] mb-16 relative flex p-6 gap-6" onClick={e => e.stopPropagation()}>
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
                 onBlur={handleSaveTitle}
                 onKeyDown={e => {
                   if (e.key === 'Enter') handleSaveTitle();
                   if (e.key === 'Escape') {
                     setTitleInput(card.title);
                     setIsEditingTitle(false);
                   }
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
                     <button onClick={handleSaveDesc} className="bg-[#0079bf] hover:bg-[#026aa7] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">Save</button>
                     <button onClick={() => { setIsEditingDesc(false); setDescInput(card.description || ""); }} className="px-2 py-1.5 hover:bg-black/10 text-[#172b4d] rounded transition-colors text-sm font-medium">Cancel</button>
                   </div>
                 </div>
               ) : (
                 card.description ? (
                   <p 
                     className="text-[#172b4d] text-sm bg-gray-200/50 hover:bg-gray-300/60 p-3 rounded-lg leading-relaxed cursor-pointer transition-colors"
                     onClick={() => setIsEditingDesc(true)}
                   >
                     {card.description}
                   </p>
                 ) : (
                   <button 
                     type="button"
                     className="bg-gray-200/80 hover:bg-gray-300 px-4 py-3 rounded-lg text-[#172b4d] w-full text-left transition-colors font-medium text-sm"
                     onClick={() => setIsEditingDesc(true)}
                   >
                     Add a more detailed description...
                   </button>
                 )
               )}
             </div>
          </div>

          <div className="relative mt-2 ml-10">
            <button
              type="button"
              className="bg-gray-200/80 hover:bg-gray-300 px-3 py-1.5 rounded-md text-sm flex items-center gap-2 text-[#172b4d] font-medium transition-colors w-fit"
              onClick={() => setShowChecklistPopover(!showChecklistPopover)}
            >
              <CheckSquare size={16}/> Add Checklist
            </button>
            {showChecklistPopover && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded shadow-xl z-20 p-2">
                <div className="flex justify-between items-center mb-2 pb-2 border-b"><h4 className="font-semibold text-sm w-full text-center text-black">Add checklist</h4><button onClick={() => setShowChecklistPopover(false)} className="text-black"><X size={14}/></button></div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-600 block">Title</label>
                  <input 
                    type="text" 
                    autoFocus
                    value={newChecklistTitle || ""} 
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    className="w-full border border-gray-300 p-1.5 text-sm rounded outline-none focus:border-blue-500 transition-colors text-black"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateChecklist();
                    }}
                  />
                  <button 
                    onClick={handleCreateChecklist}
                    className="w-full bg-[#0079bf] hover:bg-[#026aa7] text-white py-1.5 text-xs font-medium rounded transition-colors mt-2"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {card.checklists?.map((cl: any) => (
             <div key={cl.id} className="flex gap-4">
               <CheckSquare className="mt-1 flex-shrink-0" size={24} />
               <div className="flex-1">
                 <h3 className="font-semibold text-lg mb-3">{cl.title}</h3>
                 <div className="flex flex-col gap-2.5">
                  {cl.items?.map((item: any) => (
                     <label key={item.id} className="flex items-center gap-3 bg-white p-2 rounded shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                       <input 
                         type="checkbox" 
                         checked={!!item.is_completed} 
                         onChange={() => handleToggleChecklist(cl.id, item.id, item.is_completed)}
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
                          value={newItemTitle || ""}
                          onChange={e => setNewItemTitle(e.target.value)}
                          placeholder="Add an item"
                          className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:border-blue-500 transition-colors text-[#172b4d]"
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddChecklistItemSubmit(cl.id);
                            if (e.key === 'Escape') setAddingItemTo(null);
                          }}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleAddChecklistItemSubmit(cl.id)} className="bg-[#0079bf] hover:bg-[#026aa7] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">Add</button>
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

        <div className="w-44 flex flex-col gap-2">
          <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 mt-10">Add to card</h4>
          
          <div className="relative">
            <button className="bg-gray-200/80 hover:bg-gray-300 w-full px-3 py-1.5 rounded-md text-sm flex items-center gap-2 text-[#172b4d] font-medium transition-colors" onClick={() => setShowMemberPopover(!showMemberPopover)}><User size={16}/> Members</button>
            {showMemberPopover && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded shadow-xl z-10 p-2">
                <div className="flex justify-between items-center mb-2 pb-2 border-b"><h4 className="font-semibold text-sm w-full text-center">Members</h4><button onClick={() => setShowMemberPopover(false)}><X size={14}/></button></div>
                <div className="flex flex-col gap-2">
                  {allUsers.map(u => {
                    const isSelected = card.members?.some((m: any) => m.id === u.id);
                    return (
                      <label key={u.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-100 rounded">
                        <input type="checkbox" checked={!!isSelected} onChange={() => toggleMember(u.id)} className="w-4 h-4 cursor-pointer accent-[#0079bf]" />
                        <div className="w-6 h-6 rounded-full bg-[#0052cc] text-white flex items-center justify-center text-xs font-bold">{u.name[0]?.toUpperCase()}</div>
                        <span className="text-sm">{u.name}</span>
                      </label>
                    );
                  })}
                  <div className="mt-2 border-t pt-2">
                    <input 
                      type="text" 
                      placeholder="New user name..." 
                      value={newUserName} 
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full border border-gray-300 p-1.5 text-sm rounded mb-2 outline-none text-black"
                    />
                    <button 
                      onClick={handleCreateUser}
                      className="w-full bg-[#0079bf] hover:bg-[#026aa7] text-white text-xs py-1.5 font-medium rounded transition-colors"
                    >
                      Create User
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button className="bg-gray-200/80 hover:bg-gray-300 w-full px-3 py-1.5 rounded-md text-sm flex items-center gap-2 text-[#172b4d] font-medium transition-colors" onClick={() => setShowLabelPopover(!showLabelPopover)}><Tag size={16}/> Labels</button>
            {showLabelPopover && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded shadow-xl z-10 p-2">
                <div className="flex justify-between items-center mb-2 pb-2 border-b"><h4 className="font-semibold text-sm w-full text-center">Labels</h4><button onClick={() => setShowLabelPopover(false)}><X size={14}/></button></div>
                <div className="flex flex-col gap-2">
                  {allLabels.map(l => {
                    const isSelected = card.labels?.some((lbl: any) => lbl.id === l.id);
                    return (
                      <label key={l.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-100 rounded">
                        <input type="checkbox" checked={!!isSelected} onChange={() => toggleLabel(l.id)} className="w-4 h-4 cursor-pointer accent-[#0079bf] shrink-0" />
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
               try { dateInputRef.current?.showPicker(); } catch (e) { /* fallback for unsupported browsers */ }
             }}
          >
             <Clock size={16} className="flex-shrink-0" />
             <span className="truncate">{dueDate ? new Date(dueDate + 'T12:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }) : "Dates"}</span>
             <input ref={dateInputRef} type="date" value={dueDate || ""} onChange={handleDateChange} className="absolute opacity-0 w-[1px] h-[1px] top-0 left-0 -z-10" />
          </label>
          
          <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 mt-4">Actions</h4>
          <button 
            className="bg-gray-200/80 hover:bg-gray-300 w-full px-3 py-1.5 rounded-md text-sm flex items-center gap-2 text-[#172b4d] font-medium transition-colors"
            onClick={() => setShowArchiveConfirm(true)}
          >
            <Trash2 size={16}/> Archive
          </button>
          
          <button 
            className="bg-red-50 hover:bg-red-100 w-full px-3 py-1.5 rounded-md text-sm flex items-center gap-2 text-red-700 font-medium transition-colors mt-2"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={16}/> Delete
          </button>
        </div>
      </div>

      {showArchiveConfirm && (
        <ConfirmPopover 
          title="Archive card?"
          message="Are you sure you want to archive this card? It will be removed from the board but can be restored later."
          confirmLabel="Archive"
          variant="primary"
          onConfirm={() => {
            saveCardAttribute({ is_archived: true });
            onClose();
          }}
          onClose={() => setShowArchiveConfirm(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmPopover 
          title="Delete card?"
          message="Are you sure you want to delete this card forever? This action cannot be undone."
          confirmLabel="Delete forever"
          onConfirm={() => {
            if (onDelete) onDelete(card.list_id);
          }}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

