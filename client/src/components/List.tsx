"use client";

import { useState, useRef, useEffect, memo, useCallback } from "react";
import { List as ListType } from "@/types";
import CardComponent from "./Card";
import { Plus, X, Trash2 } from "lucide-react";
import { apiUrl } from "@/lib/utils";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import ConfirmPopover from "./ConfirmPopover";

interface ListProps {
  list: ListType;
  index: number;
  updateListTitle: (id: number, title: string) => void;
  deleteList: (id: number) => void;
  addCard: (listId: number, title: string) => void;
  deleteCard: (cardId: number, listId: number) => void;
  openCard: (id: number) => void;
  isDragDisabled?: boolean;
  selectedCards?: number[];
  toggleCardSelection?: (id: number) => void;
  updateCard?: (card: any) => void;
}

const List = memo(function List({ 
  list, 
  index, 
  updateListTitle, 
  deleteList, 
  addCard, 
  deleteCard, 
  openCard, 
  isDragDisabled, 
  selectedCards, 
  toggleCardSelection, 
  updateCard 
}: ListProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleUpdateTitle = useCallback(() => {
    if (title.trim() && title !== list.title) {
      updateListTitle(list.id, title);
    } else {
      setTitle(list.title);
    }
    setIsEditingTitle(false);
  }, [title, list.id, list.title, updateListTitle]);

  const handleAddCard = useCallback(async () => {
    if (newCardTitle.trim()) {
      await addCard(list.id, newCardTitle);
      setNewCardTitle("");
      setIsAddingCard(false);
    }
  }, [newCardTitle, list.id, addCard]);

  const handleToggleComplete = useCallback(async (cardId: number, currentStatus: boolean) => {
    if (!updateCard) return;
    try {
      const res = await fetch(apiUrl(`cards/${cardId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !currentStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        updateCard(updated);
      }
    } catch (err) {
      console.error(err);
    }
  }, [updateCard]);

  return (
    <Draggable draggableId={`list-${list.id}`} index={index} isDragDisabled={isDragDisabled}>
      {(provided) => (
        <div 
          className="w-[300px] shrink-0 bg-[#101204] rounded-lg p-2 flex flex-col max-h-full border border-[#3b444c] shadow-md"
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div 
            className="pb-2 font-semibold text-white flex justify-between items-center group px-2 pt-1"
            {...provided.dragHandleProps}
          >
            {isEditingTitle ? (
              <input
                ref={inputRef}
                className="text-sm px-1.5 py-1 font-semibold border-2 border-[#579dff] bg-[#22272b] text-white rounded outline-none w-full"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleUpdateTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdateTitle();
                  if (e.key === "Escape") {
                    setTitle(list.title);
                    setIsEditingTitle(false);
                  }
                }}
              />
            ) : (
              <h2 
                className="text-sm px-1 font-semibold cursor-pointer w-full text-balance"
                onClick={() => setIsEditingTitle(true)}
              >
                {list.title}
              </h2>
            )}
            <button 
              className="p-1 rounded-md hover:bg-white/5 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0"
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete list"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {showDeleteConfirm && (
            <ConfirmPopover 
              title="Delete list?"
              message="Are you sure you want to delete this list? All cards in this list will also be deleted. This action cannot be undone."
              confirmLabel="Delete forever"
              onConfirm={() => deleteList(list.id)}
              onClose={() => setShowDeleteConfirm(false)}
            />
          )}

          
          <Droppable droppableId={list.id.toString()} type="card">
            {(provided, snapshot) => (
              <div 
                className={`flex-1 overflow-y-auto custom-scrollbar px-1 flex flex-col gap-2 min-h-[100px] transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-white/5 rounded-md' : ''}`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {list.cards.map((card, idx) => (
                  <CardComponent 
                    key={card.id} 
                    card={card} 
                    index={idx} 
                    onClick={() => openCard(card.id)} 
                    isDragDisabled={isDragDisabled}
                    isSelected={selectedCards?.includes(card.id)}
                    onToggleSelect={toggleCardSelection}
                    onToggleComplete={handleToggleComplete}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <div className="pt-2">
            {isAddingCard ? (
              <div className="flex flex-col gap-1.5 pt-2">
                <textarea
                  autoFocus
                  className="w-full px-2 py-1.5 text-sm rounded-lg shadow-sm outline-none resize-none border-none ring-2 ring-[#579dff] bg-[#22272b] text-white"
                  placeholder="Enter a title for this card..."
                  rows={3}
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(); }
                    if (e.key === 'Escape') setIsAddingCard(false);
                  }}
                />
                <div className="flex items-center gap-2">
                  <button 
                    className="bg-[#579dff] hover:bg-[#85b8ff] text-[#1d2125] px-3 py-1.5 rounded text-sm font-bold transition-colors"
                    onClick={handleAddCard}
                  >
                    Add card
                  </button>
                  <button 
                    className="p-1 text-white/70 hover:text-white transition-colors"
                    onClick={() => setIsAddingCard(false)}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                className="text-white hover:bg-white/5 rounded-md px-2 py-1.5 w-full text-left transition-colors text-sm font-medium flex items-center gap-1.5 mt-1"
                onClick={() => setIsAddingCard(true)}
              >
                <Plus size={16} className="text-white" /> Add a card
              </button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
});

export default List;
