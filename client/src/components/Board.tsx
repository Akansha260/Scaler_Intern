"use client";

import { Board as BoardType } from "@/types";
import ListComponent from "./List";
import CardModal from "./CardModal";
import { useBoard } from "@/hooks/useBoard";
import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";

export default function Board({ initialBoard }: { initialBoard: BoardType }) {
  const { board, addList, updateListTitle, deleteList, addCard, deleteCard, reorderLists, moveCard } = useBoard(initialBoard);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [openCardId, setOpenCardId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredLists = board.lists.map(list => ({
    ...list,
    cards: list.cards.filter(card => card.title.toLowerCase().includes(searchQuery.toLowerCase()))
  }));

  const isFiltering = searchQuery.length > 0;

  return (
    <div className="flex flex-col h-full items-start gap-4">
      <div className="w-64">
        <input 
          placeholder="Search cards by title..." 
          className="w-full px-3 py-1.5 rounded bg-white/20 text-white placeholder-white/80 focus:bg-white focus:text-[#172b4d] outline-none transition-colors border-2 border-transparent focus:border-blue-500 shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="flex-1 w-full overflow-hidden">
        <DragDropContext onDragEnd={isFiltering ? () => {} : onDragEnd}>
          <Droppable droppableId="board" type="list" direction="horizontal" isDropDisabled={isFiltering}>
            {(provided) => (
              <div 
                className="flex gap-4 h-full items-start"
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
      {openCardId && <CardModal cardId={openCardId} onClose={() => setOpenCardId(null)} />}
    </div>
  );
}
