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
  });

  const toggleCardSelection = useCallback((cardId: number) => {
    setSelectedCards(prev => prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]);
  }, []);

  const handleBoardDelete = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/boards/${board.id}`, { method: 'DELETE' });
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
        return true;
      }),
    }));
  }, [board.lists, filter, isFiltering]);

  if (!isMounted) return null;

  return (
    <DragDropContext onDragEnd={isFiltering ? () => {} : onDragEnd}>
      <div className="flex flex-col h-[calc(100vh-2.5rem)] w-full gap-4 overflow-hidden bg-[#0079bf]">
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
        
        <Droppable droppableId="board" type="list" direction="horizontal" isDropDisabled={isFiltering}>
          {(provided) => (
            <div 
              className="flex-1 w-full overflow-x-auto custom-scrollbar flex gap-4 items-start px-4 pb-4" 
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
              <div className="w-[272px] shrink-0">
                 {isAddingList ? (
                  <div className="bg-[#ebecf0] rounded-xl p-2 shadow-sm">
                    <input autoFocus className="w-full px-2 py-1.5 text-sm rounded shadow-inner outline-none text-[#172b4d]" placeholder="Enter list title..." value={newListTitle} onChange={(e) => setNewListTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { addList(newListTitle); setNewListTitle(""); setIsAddingList(false); } if (e.key === 'Escape') setIsAddingList(false); }} />
                    <div className="flex items-center gap-2 mt-2">
                      <button className="bg-[#0079bf] text-white px-3 py-1.5 rounded text-sm font-medium" onClick={() => { addList(newListTitle); setNewListTitle(""); setIsAddingList(false); }}>Add list</button>
                      <button className="p-1.5 text-gray-500 hover:text-gray-800" onClick={() => setIsAddingList(false)}><X size={20} /></button>
                    </div>
                  </div>
                ) : (
                  <button className="bg-white/20 hover:bg-white/30 text-white w-full rounded-xl p-3 text-left font-medium transition-colors flex items-center gap-1" onClick={() => setIsAddingList(true)}><Plus size={20} /> Add another list</button>
                 )}
              </div>
            </div>
          )}
        </Droppable>

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
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#172b4d] text-white px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl z-50">
             <span className="font-semibold">{selectedCards.length} cards selected</span>
             <button onClick={() => setShowBulkDeleteConfirm(true)} className="bg-red-500 px-4 py-1.5 rounded-full text-sm font-bold">Delete</button>
             <button onClick={() => setSelectedCards([])} className="bg-white/20 px-3 py-1.5 rounded-full text-sm font-medium">Cancel</button>
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
    </DragDropContext>
  );
}
