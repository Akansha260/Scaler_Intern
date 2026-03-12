"use client";

import { Board as BoardType } from "@/types";
import ListComponent from "./List";
import CardModal from "./CardModal";
import FilterPopover, { FilterState } from "./FilterPopover";
import ArchiveMenu from "./ArchiveMenu";
import ConfirmPopover from "./ConfirmPopover";
import { useBoard } from "@/hooks/useBoard";
import { useState, useEffect } from "react";
import { Plus, X, Filter, Archive } from "lucide-react";
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

  const toggleCardSelection = (cardId: number) => {
    setSelectedCards(prev => 
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filter, setFilter] = useState<FilterState>({
    keyword: "",
    noMembers: false,
    members: [],
    noLabels: false,
    labels: [],
    noDueDate: false,
    overdue: false,
  });

  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  useEffect(() => setIsMounted(true), []);

  const handleAddList = async () => {
    if (newListTitle.trim()) {
      await addList(newListTitle);
      setNewListTitle("");
      setIsAddingList(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, type } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === "list") {
      reorderLists(source.index, destination.index);
    } else if (type === "card") {
      const sourceListId = parseInt(source.droppableId);
      const destListId = parseInt(destination.droppableId);
      moveCard(sourceListId, destListId, source.index, destination.index);
    }
  };

  if (!isMounted) return null;

  const allLabelsMap = new Map();
  const allMembersMap = new Map();
  
  board.lists.forEach(l => {
    l.cards.forEach(c => {
      c.labels?.forEach(lb => allLabelsMap.set(lb.id, lb));
      c.members?.forEach(m => allMembersMap.set(m.id, m));
    });
  });
  const allLabels = Array.from(allLabelsMap.values());
  const allMembers = Array.from(allMembersMap.values());

  const filteredLists = board.lists.map(list => ({
    ...list,
    cards: list.cards.filter(card => {
      if (filter.keyword && !card.title.toLowerCase().includes(filter.keyword.toLowerCase())) return false;
      if (filter.noMembers && card.members?.length > 0) return false;
      if (filter.members.length > 0 && !card.members?.some(m => filter.members.includes(m.id))) return false;
      if (filter.noLabels && card.labels?.length > 0) return false;
      if (filter.labels.length > 0 && !card.labels?.some(l => filter.labels.includes(l.id))) return false;

      const dueRaw = card.due_date;
      if (filter.noDueDate && dueRaw) return false;
      if (filter.overdue) {
        if (!dueRaw) return false;
        const due = new Date(dueRaw);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (due >= today) return false;
      }

      return true;
    }),
  }));

  const activeFilterCount =
    (filter.keyword ? 1 : 0) +
    (filter.noMembers ? 1 : 0) +
    filter.members.length +
    (filter.noLabels ? 1 : 0) +
    filter.labels.length +
    (filter.noDueDate ? 1 : 0) +
    (filter.overdue ? 1 : 0);
  const isFiltering = activeFilterCount > 0;

  return (
    <div className="flex flex-col h-full w-full py-4 gap-4">
      <div className="px-4 shrink-0 flex items-center justify-start w-full relative">
        <button 
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isFiltering ? 'bg-[#85b8ff] text-[#172b4d]' : 'bg-white/20 hover:bg-white/30 text-white'}`}
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <Filter size={16} /> Filter 
          {activeFilterCount > 0 && (
            <span className="bg-[#172b4d] text-white px-1.5 py-0.5 rounded-sm text-xs leading-none">{activeFilterCount}</span>
          )}
        </button>
        {isFilterOpen && (
           <FilterPopover 
             filter={filter}
             setFilter={setFilter}
             allLabels={allLabels}
             allMembers={allMembers}
             onClose={() => setIsFilterOpen(false)}
           />
        )}

        <button 
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-white/20 hover:bg-white/30 text-white ml-2"
          onClick={() => setIsArchiveOpen(true)}
        >
          <Archive size={16} /> Archived Items
        </button>
      </div>
      
      <div className="flex-1 w-full overflow-x-auto overflow-y-hidden custom-scrollbar">
        <DragDropContext onDragEnd={isFiltering ? () => {} : onDragEnd}>
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
                  />
                ))}
                {provided.placeholder}

                <div className="w-[272px] shrink-0">
                   {isAddingList ? (
                    <div className="bg-[#ebecf0] rounded-xl p-2 shadow-sm">
                      <input
                        autoFocus
                        className="w-full px-2 py-1.5 text-sm rounded-sm border-2 border-blue-500 shadow-inner outline-none text-[#172b4d]"
                        placeholder="Enter list title..."
                        value={newListTitle}
                        onChange={(e) => setNewListTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddList();
                          if (e.key === 'Escape') setIsAddingList(false);
                        }}
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <button 
                          className="bg-[#0079bf] hover:bg-[#026aa7] text-white px-3 py-1.5 rounded text-sm font-medium"
                          onClick={handleAddList}
                        >
                          Add list
                        </button>
                        <button 
                          className="p-1.5 text-gray-500 hover:text-gray-800 transition-colors"
                          onClick={() => setIsAddingList(false)}
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      className="bg-white/20 hover:bg-white/30 text-white w-full rounded-xl p-3 text-left font-medium transition-colors flex items-center gap-1"
                      onClick={() => setIsAddingList(true)}
                    >
                      <Plus size={20} /> Add another list
                    </button>
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
          onClose={() => setOpenCardId(null)}
          onDelete={(listId) => {
            deleteCard(openCardId, listId);
            setOpenCardId(null);
          }}
          onUpdated={updateCardInBoard}
        />
      )}
      {isArchiveOpen && (
        <ArchiveMenu 
          boardId={board.id} 
          onClose={() => setIsArchiveOpen(false)}
          onRestore={updateCardInBoard}
          onDelete={(cardId) => {
             setSelectedCards(prev => prev.filter(id => id !== cardId));
          }}
        />
      )}
      
      {selectedCards.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#172b4d] text-white px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl z-50 animate-in slide-in-from-bottom">
           <span className="font-semibold">{selectedCards.length} cards selected</span>
           <div className="flex gap-2">
             <button 
               onClick={() => setShowBulkDeleteConfirm(true)}
               className="bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-full text-sm font-bold transition-colors"
             >
               Delete
             </button>

             <button 
               onClick={() => setSelectedCards([])}
               className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-sm transition-colors font-medium"
             >
               Cancel
             </button>
           </div>
        </div>
      )}
      {showBulkDeleteConfirm && (
        <ConfirmPopover 
          title={`Delete ${selectedCards.length} cards?`}
          message={`Are you sure you want to delete ${selectedCards.length} selected cards forever? This action cannot be undone.`}
          confirmLabel="Delete forever"
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
    </div>
  );
}
