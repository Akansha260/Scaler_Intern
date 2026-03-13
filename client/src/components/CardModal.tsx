"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  X,
  AlignLeft,
  Tag,
  User as UserIcon,
  Clock,
  CheckSquare,
  MoreHorizontal,
  Archive,
  Trash2,
  Calendar,
  CreditCard
} from "lucide-react";
import { apiUrl } from "@/lib/utils";
import ConfirmPopover from "./ConfirmPopover";
import ChecklistSection from "./CardModal/ChecklistSection";
import DatePickerPopover from "./DatePickerPopover";

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
  const [startDate, setStartDate] = useState("");

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allLabels, setAllLabels] = useState<any[]>([]);
  const [showMemberPopover, setShowMemberPopover] = useState(false);
  const [showLabelPopover, setShowLabelPopover] = useState(false);
  const [showChecklistPopover, setShowChecklistPopover] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("Checklist");

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDatePopover, setShowDatePopover] = useState(false);
  const checklistPopoverRef = useRef<HTMLDivElement>(null);
  const memberPopoverRef = useRef<HTMLDivElement>(null);
  const labelPopoverRef = useRef<HTMLDivElement>(null);
  const [colorblindMode, setColorblindMode] = useState(false);

  useEffect(() => {
    const checkMode = () => {
      setColorblindMode(localStorage.getItem('colorblindMode') === 'true');
    };
    checkMode();
    window.addEventListener('storage', checkMode);
    return () => window.removeEventListener('storage', checkMode);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (showChecklistPopover && checklistPopoverRef.current && !checklistPopoverRef.current.contains(target)) {
        setShowChecklistPopover(false);
      }
      if (showMemberPopover && memberPopoverRef.current && !memberPopoverRef.current.contains(target)) {
        setShowMemberPopover(false);
      }
      if (showLabelPopover && labelPopoverRef.current && !labelPopoverRef.current.contains(target)) {
        setShowLabelPopover(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showChecklistPopover, showMemberPopover, showLabelPopover]);

  useEffect(() => {
    fetch(apiUrl(`cards/${cardId}`))
      .then(res => res.json())
      .then(data => {
        setCard(data);
        setDescInput(data.description || "");
        setTitleInput(data.title || "");
        if (data.due_date) {
          setDueDate(data.due_date);
        } else {
          setDueDate("");
        }
        if (data.start_date) {
          setStartDate(data.start_date);
        } else {
          setStartDate("");
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

  const handleTitleUpdate = () => {
    if (!titleInput.trim() || titleInput === card.title) {
      setTitleInput(card.title);
      return;
    }
    saveCardAttribute({ title: titleInput.trim() });
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

  const handleDeleteChecklistItem = async (checklistId: number, itemId: number) => {
    const res = await fetch(apiUrl(`cards/${cardId}/checklist-items/${itemId}`), {
      method: "DELETE",
    });
    if (res.ok) {
      const res2 = await fetch(apiUrl(`cards/${cardId}`));
      const fullCard = await res2.json();
      setCard(fullCard);
      if (onUpdated) onUpdated(fullCard);
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

  const [popoverPos, setPopoverPos] = useState({ top: 80, left: 40 });
  const [activePopover, setActivePopover] = useState<string | null>(null);

  const openPopover = (e: React.MouseEvent, type: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scrollContainer = document.querySelector('.modal-body-scroll');
    if (scrollContainer) {
      const scrollRect = scrollContainer.getBoundingClientRect();
      const scrollHeight = scrollContainer.scrollHeight;
      const scrollWidth = scrollContainer.clientWidth;
      const scrollTop = scrollContainer.scrollTop;

      const popoverWidth = 280;
      const popoverHeight = 350;

      // Calculate top/left relative to the scrollable container
      let top = rect.bottom - scrollRect.top + scrollTop + 5;
      let left = rect.left - scrollRect.left;

      // Ensure it doesn't overflow right
      if (left + popoverWidth > scrollWidth) {
        left = scrollWidth - popoverWidth - 10;
      }

      // If it would overflow the scroll content at the bottom, try showing above
      if (top + popoverHeight > scrollHeight && (rect.top - scrollRect.top + scrollTop) > popoverHeight) {
        top = rect.top - scrollRect.top + scrollTop - popoverHeight - 5;
      }

      setPopoverPos({ top, left });
    }

    if (type === 'members') setShowMemberPopover(true);
    if (type === 'labels') setShowLabelPopover(true);
    if (type === 'checklist') setShowChecklistPopover(true);
  };

  const getPatternClass = (color: string) => {
    const c = color.toLowerCase();
    if (c.includes('green') || c === '#4bce97' || c === '#1f845a') return 'pattern-diagonal';
    if (c.includes('yellow') || c === '#f5cd47') return 'pattern-dots';
    if (c.includes('orange') || c === '#fea362') return 'pattern-waves';
    if (c.includes('red') || c === '#f87168' || c === '#ae2e24') return 'pattern-lines';
    if (c.includes('blue') || c === '#579dff' || c === '#0052cc') return 'pattern-vertical';
    // Be more inclusive for purple/violet
    if (c.includes('purple') || c.includes('violet') || c === '#9f8fef' || c === '#b658d7') return 'pattern-checkered';
    return '';
  };

  const handleDeleteChecklist = async (checklistId: number) => {
  try {
    const response = await fetch(apiUrl(`cards/${cardId}/checklists/${checklistId}`), {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete checklist");

    setCard((prev: any) => ({
      ...prev,
      checklists: prev.checklists?.filter((cl: any) => cl.id !== checklistId) || []
    }));

  } catch (err) {
    console.error("Error deleting checklist:", err);
  }
};
  if (!card) return <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center"><div className="bg-white p-4 rounded text-black">Loading...</div></div>;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex justify-center items-start pt-16 overflow-y-auto modal-backdrop" onClick={onClose}>
      <div className="bg-[#1d2125] w-full max-w-3xl rounded-xl max-h-[85vh] overflow-hidden mb-16 relative flex flex-col shadow-2xl modal-content border border-[#3b444c]" onClick={e => e.stopPropagation()}>
        {/* Header: Icon & List Title */}
        <div className="p-4 pb-0 flex justify-between items-start z-10 w-full relative">
          <div className="flex items-center gap-3">
            <CreditCard className="text-white shrink-0" size={20} />
            <span className="text-sm font-medium text-white">{card.list_title}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white"><X size={20} /></button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 pt-0 flex-1 overflow-y-auto custom-scrollbar modal-body-scroll relative">
          <div className="flex flex-col gap-1">
            <div className="flex gap-4 items-center">
              <div
                className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all shrink-0 ${card.is_completed ? 'bg-[#1f845a] border-[#1f845a] text-white' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
                onClick={() => saveCardAttribute({ is_completed: !card.is_completed })}
                title="Mark as complete"
              >
                {card.is_completed && <CheckSquare size={14} />}
              </div>
              <div className="flex-1">
                {isEditingTitle ? (
                  <input
                    autoFocus
                    className="text-2xl font-bold bg-[#22272b] border-2 border-[#579dff] rounded px-2 py-0.5 w-full outline-none text-white"
                    value={titleInput}
                    onChange={e => setTitleInput(e.target.value)}
                    onBlur={() => { setIsEditingTitle(false); handleTitleUpdate(); }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { setIsEditingTitle(false); handleTitleUpdate(); }
                      if (e.key === 'Escape') { setTitleInput(card.title); setIsEditingTitle(false); }
                    }}
                  />
                ) : (
                  <h2
                    className="text-2xl font-bold cursor-pointer w-full hover:bg-white/5 px-2 py-0.5 rounded -ml-2 transition-colors leading-tight text-white"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {card.title}
                  </h2>
                )}
              </div>
            </div>
          </div>


          {/* Attributes Row: Members, Dates, Labels */}
          <div className="flex gap-10 ml-10 flex-wrap items-start mt-8 mb-10">
            {/* Members Group */}
            <div className="flex flex-col min-w-[80px]">
              <h3 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2">Members</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {card.members?.map((member: any) => (
                  <div key={member.id} className="w-8 h-8 rounded-full bg-[#0052cc] text-white flex items-center justify-center text-xs font-bold border-2 border-[#1d2125] shadow-sm" title={member.name}>
                    {member.name[0]?.toUpperCase()}
                  </div>
                ))}
                <button
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                  onClick={(e) => openPopover(e, 'members')}
                  title="Add member"
                >
                  <UserIcon size={16} />
                </button>
              </div>
            </div>

            {/* Dates Group */}
            <div className="flex flex-col min-w-[150px]">
              <h3 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2">Dates</h3>
              <div
                className={`flex items-center gap-2 transition-colors cursor-pointer relative group ${startDate || dueDate ? "bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded w-fit" : "px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-sm font-medium text-white"
                  }`}
                onClick={() => setShowDatePopover(true)}
              >
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-white" />
                  <span className="text-sm font-medium text-white">
                    {startDate || dueDate ? (
                      <>
                        {startDate && new Date(startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        {startDate && dueDate && " - "}
                        {dueDate && new Date(dueDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </>
                    ) : "Set dates"}
                  </span>
                  {dueDate && (() => {
                    const due = new Date(dueDate);
                    const now = new Date();
                    const isOverdue = due < now;
                    const diffInHrs = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
                    const isDueSoon = diffInHrs >= 0 && diffInHrs <= 24;

                    if (card.is_completed) return (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-1 bg-[#1f845a] text-white">
                        Complete
                      </span>
                    );
                    if (isOverdue) return (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-1 bg-red-500 text-white">
                        Overdue
                      </span>
                    );
                    if (isDueSoon) return (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-1 bg-[#f5cd47] text-black">
                        Due Soon
                      </span>
                    );
                    return null;
                  })()}
                </div>
              </div>
            </div>

            {/* Labels Group */}
            <div className="flex flex-col min-w-[100px]">
              <h3 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2">Labels</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {card.labels?.map((label: any) => (
                  <div
                    key={label.id}
                    className={`h-8 w-11 flex items-center justify-center rounded text-white text-xs font-bold shadow-sm transition-all hover:brightness-95 cursor-pointer ${colorblindMode ? getPatternClass(label.color) : ''
                      }`}
                    style={{ backgroundColor: label.color }}
                    title={label.name || label.color}
                    onClick={(e) => openPopover(e, 'labels')}
                  >
                  </div>
                ))}
                <button
                  className={`flex items-center justify-center transition-colors ${card.labels?.length > 0
                    ? "w-8 h-8 rounded bg-white/5 hover:bg-white/10 text-white"
                    : "px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-sm font-medium gap-2 text-white"
                    }`}
                  onClick={(e) => openPopover(e, 'labels')}
                  title="Add label"
                >
                  <Tag size={16} />
                  {(!card.labels || card.labels.length === 0) && "Add Labels"}
                </button>
              </div>
            </div>

            {/* Checklist Action (Only when no checklists) */}
            {(!card.checklists || card.checklists.length === 0) && (
              <div className="flex flex-col min-w-[100px]">
                <h3 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2">Add</h3>
                <button
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-sm font-medium flex items-center gap-2 transition-colors transition-all w-fit text-white"
                  onClick={(e) => openPopover(e, 'checklist')}
                >
                  <CheckSquare size={16} /> Checklist
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <AlignLeft className="mt-1 flex-shrink-0 text-white" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-3 text-white">Description</h3>
              {isEditingDesc ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    className="w-full bg-[#161a1d] border-none ring-2 ring-[#579dff] rounded-md p-3 text-sm outline-none resize-none text-white min-h-[100px] shadow-sm"
                    autoFocus
                    value={descInput}
                    onChange={e => setDescInput(e.target.value)}
                    placeholder="Add a more detailed description..."
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setIsEditingDesc(false); saveCardAttribute({ description: descInput }); }} className="bg-[#579dff] hover:bg-[#85b8ff] text-[#1d2125] px-3 py-1.5 rounded text-sm font-bold transition-colors">Save</button>
                    <button onClick={() => { setIsEditingDesc(false); setDescInput(card.description || ""); }} className="px-2 py-1.5 hover:bg-white/5 text-white rounded transition-colors text-sm font-medium">Cancel</button>
                  </div>
                </div>
              ) : (
                <p
                  className="text-white text-sm bg-white/5 hover:bg-white/10 p-3 rounded-lg leading-relaxed cursor-pointer transition-colors"
                  onClick={() => setIsEditingDesc(true)}
                >
                  {card.description || "Add a more detailed description..."}
                </p>
              )}
            </div>
          </div>

          {card.checklists?.length > 0 && (
            <div className="mt-8 mb-6">
              <button
                className="bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md text-sm flex items-center gap-2 text-white font-medium transition-colors w-fit"
                onClick={(e) => openPopover(e, 'checklist')}
              >
                <CheckSquare size={16} /> Add Checklist
              </button>
            </div>
          )}

          <ChecklistSection
            checklists={card.checklists}
            onToggleItem={handleToggleChecklist}
            onAddItem={handleAddChecklistItem}
            onUpdateTitle={handleUpdateChecklistTitle}
            onDeleteItem={handleDeleteChecklistItem}
            onDeleteChecklist={handleDeleteChecklist}
          />

          <div className="mt-8 flex items-center justify-between border-t border-[#3b444c] pt-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowArchiveConfirm(true)} className="flex items-center gap-2 text-sm text-white hover:bg-white/5 px-2 py-1 rounded transition-colors font-medium">
                <Archive size={16} /> Archive
              </button>
              <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 font-medium">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>

          {showMemberPopover && (
            <div
              className="absolute w-64 bg-[#282e33] border border-[#454f59] rounded shadow-2xl z-[100] p-2"
              ref={memberPopoverRef}
              style={{ top: popoverPos.top, left: popoverPos.left }}
            >
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#454f59]"><h4 className="font-semibold text-sm w-full text-center text-white">Members</h4><button onClick={() => setShowMemberPopover(false)} className="text-white hover:bg-white/10 rounded p-0.5"><X size={14} /></button></div>
              <div className="flex flex-col gap-2">
                {allUsers.map(u => {
                  const isSelected = card.members?.some((m: any) => m.id === u.id);
                  return (
                    <label key={u.id} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-white/5 rounded">
                      <input type="checkbox" checked={!!isSelected} onChange={() => handleToggleMember(u.id)} className="w-4 h-4 cursor-pointer accent-[#579dff]" />
                      <div className="w-6 h-6 rounded-full bg-[#0052cc] text-white flex items-center justify-center text-xs font-bold">{u.name[0]?.toUpperCase()}</div>
                      <span className="text-sm text-white">{u.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {showLabelPopover && (
            <div
              className="absolute w-72 bg-[#282e33] border border-[#454f59] rounded shadow-2xl z-[100] p-2"
              ref={labelPopoverRef}
              style={{ top: popoverPos.top, left: popoverPos.left }}
            >
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#454f59]"><h4 className="font-semibold text-sm w-full text-center text-white">Labels</h4><button onClick={() => setShowLabelPopover(false)} className="text-white hover:bg-white/10 rounded p-0.5"><X size={14} /></button></div>
              <div className="flex flex-col gap-1.5 p-1">
                {allLabels.map(l => {
                  const isSelected = card.labels?.some((lbl: any) => lbl.id === l.id);
                  return (
                    <div key={l.id} className="flex items-center gap-2 group">
                      <input type="checkbox" checked={!!isSelected} onChange={() => handleToggleLabel(l.id)} className="w-4 h-4 cursor-pointer accent-[#579dff] shrink-0" />
                      <div
                        onClick={() => handleToggleLabel(l.id)}
                        className={`h-8 flex-1 rounded cursor-pointer transition-all hover:brightness-90 flex items-center px-3 text-white text-[11px] font-bold ${colorblindMode ? getPatternClass(l.color) : ''}`}
                        style={{ backgroundColor: l.color }}
                        title={l.name}
                      >
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 pt-2 border-t border-[#454f59] px-1">
                <button
                  onClick={() => {
                    const next = !colorblindMode;
                    setColorblindMode(next);
                    localStorage.setItem('colorblindMode', String(next));
                    window.dispatchEvent(new Event('storage'));
                  }}
                  className="w-full text-left px-2 py-1.5 hover:bg-white/5 rounded text-xs font-medium text-white flex items-center justify-between"
                >
                  Show colorblind friendly patterns
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${colorblindMode ? 'bg-[#1f845a]' : 'bg-[#454f59]'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${colorblindMode ? 'left-[18px]' : 'left-0.5'}`} />
                  </div>
                </button>
              </div>
            </div>
          )}

          {showChecklistPopover && (
            <div
              ref={checklistPopoverRef}
              className="absolute w-64 bg-[#282e33] border border-[#454f59] rounded shadow-xl z-[110] p-2 animate-in fade-in zoom-in duration-100 origin-top-left max-h-[75vh] overflow-y-auto"
              style={{ top: popoverPos.top, left: popoverPos.left }}
            >
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#454f59]"><h4 className="font-semibold text-sm w-full text-center text-white">Add checklist</h4><button onClick={() => setShowChecklistPopover(false)} className="text-white hover:bg-white/10 rounded p-0.5"><X size={14} /></button></div>
              <div className="flex flex-col gap-2">
                <input type="text" autoFocus value={newChecklistTitle} onChange={e => setNewChecklistTitle(e.target.value)} className="w-full bg-[#161a1d] border-[#454f59] p-1.5 text-sm rounded text-white focus:ring-2 focus:ring-[#579dff] outline-none" onKeyDown={e => e.key === 'Enter' && handleCreateChecklist()} />
                <button onClick={handleCreateChecklist} className="w-full bg-[#579dff] text-[#1d2125] py-1.5 text-xs font-bold rounded mt-2 hover:bg-[#85b8ff] transition-colors">Add</button>
              </div>
            </div>
          )}
        </div>

        {/* Date Popover centered in modal */}
        {showDatePopover && (
          <div className="absolute inset-0 flex items-center justify-center z-[110] bg-black/10" onClick={() => setShowDatePopover(false)}>
            <div onClick={e => e.stopPropagation()}>
              <DatePickerPopover
                initialStartDate={startDate}
                initialDueDate={dueDate}
                onSave={(start: string | null, due: string | null) => {
                  setStartDate(start || "");
                  setDueDate(due || "");
                  saveCardAttribute({ start_date: start, due_date: due });
                  setShowDatePopover(false);
                }}
                onClose={() => setShowDatePopover(false)}
              />
            </div>
          </div>
        )}
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
