"use client";

import { Board as BoardType } from "@/types";
import ListComponent from "./List";
import CardModal from "./CardModal";
import { FilterState } from "./FilterPopover";
import ArchiveMenu from "./ArchiveMenu";
import ConfirmPopover from "./ConfirmPopover";
import BoardHeader from "./Board/BoardHeader";
import { useBoard } from "@/hooks/useBoard";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, X } from "lucide-react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { apiUrl } from "@/lib/utils";

export default function Board({ initialBoard }: { initialBoard: BoardType }) {
  const {
    board,
    addList,
    updateListTitle,
    deleteList,
    addCard,
    deleteCard,
    reorderLists,
    moveCard,
    updateCardInBoard,
  } = useBoard(initialBoard);

  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [openCardId, setOpenCardId] = useState<number | null>(null);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showDeleteBoardConfirm, setShowDeleteBoardConfirm] = useState(false);

  const [filter, setFilter] = useState<FilterState>({
    keyword: "",
    noMembers: false,
    members: [],
    noLabels: false,
    labels: [],
    noDueDate: false,
    overdue: false,
    dueSoon: false,
    complete: false,
    incomplete: false,
  });

  const toggleCardSelection = useCallback((cardId: number) => {
    setSelectedCards(prev => prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]);
  }, []);

  const handleBoardDelete = async () => {
    try {
      const res = await fetch(apiUrl(`boards/${board.id}`), { method: 'DELETE' });
      if (res.ok) window.location.href = '/';
    } catch (err) { console.error(err); }
  };

  useEffect(() => setIsMounted(true), []);

  const onDragEnd = useCallback((result: DropResult) => {
    const { destination, source, type } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    if (type === "list") reorderLists(source.index, destination.index);
    else if (type === "card") moveCard(parseInt(source.droppableId), parseInt(destination.droppableId), source.index, destination.index);
  }, [reorderLists, moveCard]);

  const activeFilterCount = useMemo(() =>
    Object.values(filter).filter(v => v === true || (Array.isArray(v) && v.length > 0) || (typeof v === 'string' && v.length > 0)).length,
    [filter]);

  const isFiltering = activeFilterCount > 0;

  const { allLabels, allMembers } = useMemo(() => {
    const labels = new Map();
    const members = new Map();
    board.lists.forEach(l => l.cards.forEach(c => {
      c.labels?.forEach(lb => labels.set(lb.id, lb));
      c.members?.forEach(m => members.set(m.id, m));
    }));
    return { allLabels: Array.from(labels.values()), allMembers: Array.from(members.values()) };
  }, [board.lists]);

  const filteredLists = useMemo(() => {
    if (!isFiltering) return board.lists;
    return board.lists.map(list => ({
      ...list,
      cards: list.cards.filter(card => {
        if (filter.keyword && !card.title.toLowerCase().includes(filter.keyword.toLowerCase())) return false;
        if (filter.noMembers && card.members?.length > 0) return false;
        if (filter.members.length > 0 && !card.members?.some(m => filter.members.includes(m.id))) return false;
        if (filter.noLabels && card.labels?.length > 0) return false;
        if (filter.labels.length > 0 && !card.labels?.some(l => filter.labels.includes(l.id))) return false;

        if (filter.noDueDate && card.due_date) return false;
        if (filter.overdue) {
          if (!card.due_date || card.is_completed) return false;
          const isOverdue = new Date(card.due_date) < new Date();
          if (!isOverdue) return false;
        }

        if (filter.dueSoon) {
          if (!card.due_date || card.is_completed) return false;
          const dueDate = new Date(card.due_date);
          const now = new Date();
          const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          if (dueDate < now || dueDate > in24Hours) return false;
        }

        if (filter.complete && !card.is_completed) return false;
        if (filter.incomplete && card.is_completed) return false;

        return true;
      }),
    }));
  }, [board.lists, filter, isFiltering]);

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] w-full gap-4 overflow-hidden bg-[#1d2125] pt-3">
      <BoardHeader
        isFiltering={isFiltering}
        activeFilterCount={activeFilterCount}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        filter={filter}
        setFilter={setFilter}
        allLabels={allLabels}
        allMembers={allMembers}
        setIsArchiveOpen={setIsArchiveOpen}
        setShowDeleteBoardConfirm={setShowDeleteBoardConfirm}
      />

      <div className="flex-1 w-full overflow-x-auto overflow-y-hidden custom-scrollbar">
        <DragDropContext onDragEnd={isFiltering ? () => { } : onDragEnd}>
          <Droppable droppableId="board" type="list" direction="horizontal" isDropDisabled={isFiltering}>
            {(provided) => (
              <div
                className="flex gap-4 h-full items-start px-4 pb-4"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {filteredLists.map((list, index) => (
                  <ListComponent
                    key={list.id}
                    list={list}
                    index={index}
                    updateListTitle={updateListTitle}
                    deleteList={deleteList}
                    addCard={addCard}
                    deleteCard={deleteCard}
                    openCard={setOpenCardId}
                    isDragDisabled={isFiltering}
                    selectedCards={selectedCards}
                    toggleCardSelection={toggleCardSelection}
                    updateCard={updateCardInBoard}
                  />
                ))}
                {provided.placeholder}
                <div className="w-[300px] shrink-0">
                  {isAddingList ? (
                    <div className="bg-[#101204] rounded-xl p-2 shadow-sm border border-[#3b444c]">
                      <input autoFocus className="w-full px-2 py-1.5 text-sm rounded shadow-inner outline-none bg-[#22272b] text-white border border-[#3b444c] focus:ring-2 focus:ring-[#579dff]" placeholder="Enter list title..." value={newListTitle} onChange={(e) => setNewListTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { addList(newListTitle); setNewListTitle(""); setIsAddingList(false); } if (e.key === 'Escape') setIsAddingList(false); }} />
                      <div className="flex items-center gap-2 mt-2">
                        <button className="bg-[#579dff] hover:bg-[#85b8ff] text-[#1d2125] px-3 py-1.5 rounded text-sm font-bold transition-colors" onClick={() => { addList(newListTitle); setNewListTitle(""); setIsAddingList(false); }}>Add list</button>
                        <button className="p-1.5 text-white/70 hover:text-white" onClick={() => setIsAddingList(false)}><X size={20} /></button>
                      </div>
                    </div>
                  ) : (
                    <button className="bg-white/5 hover:bg-white/10 text-white w-full rounded-xl p-3 text-left font-medium transition-colors flex items-center gap-1.5 border border-dashed border-white/20" onClick={() => setIsAddingList(true)}><Plus size={20} /> Add another list</button>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {openCardId && (
        <CardModal
          cardId={openCardId}
          boardId={board.id}
          onClose={() => setOpenCardId(null)}
          onDelete={(listId) => { if (openCardId) deleteCard(openCardId, listId); setOpenCardId(null); }}
          onUpdated={updateCardInBoard}
        />
      )}

      {isArchiveOpen && (
        <ArchiveMenu
          boardId={board.id}
          onClose={() => setIsArchiveOpen(false)}
          onRestore={updateCardInBoard}
          onDelete={(cardId) => setSelectedCards(prev => prev.filter(id => id !== cardId))}
        />
      )}

      {selectedCards.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#22272b] text-white px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl z-50 border border-[#3b444c]">
          <span className="font-semibold text-white">{selectedCards.length} cards selected</span>
          <button onClick={() => setShowBulkDeleteConfirm(true)} className="bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-full text-sm font-bold text-white transition-colors">Delete</button>
          <button onClick={() => setSelectedCards([])} className="bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full text-sm font-bold text-white transition-colors">Cancel</button>
        </div>
      )}

      {showBulkDeleteConfirm && (
        <ConfirmPopover
          title={`Delete ${selectedCards.length} cards?`}
          message="Permanent delete?"
          confirmLabel="Delete"
          onConfirm={async () => {
            for (const cid of selectedCards) {
              const list = board.lists.find(l => l.cards.some(c => c.id === cid));
              if (list) await deleteCard(cid, list.id);
            }
            setSelectedCards([]);
          }}
          onClose={() => setShowBulkDeleteConfirm(false)}
        />
      )}

      {showDeleteBoardConfirm && (
        <ConfirmPopover
          title="Delete board?"
          message={`Delete "${board.title}"?`}
          confirmLabel="Delete"
          onConfirm={handleBoardDelete}
          onClose={() => setShowDeleteBoardConfirm(false)}
        />
      )}
    </div>
  );
}
