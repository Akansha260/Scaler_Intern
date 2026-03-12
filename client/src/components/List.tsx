"use client";

import { List as ListType } from "@/types";
import CardComponent from "./Card";
import { Plus, X, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";

interface ListProps {
  list: ListType;
  index: number;
  updateListTitle: (id: number, title: string) => void;
  deleteList: (id: number) => void;
  addCard: (listId: number, title: string) => void;
  deleteCard: (cardId: number, listId: number) => void;
  openCard: (id: number) => void;
  isDragDisabled?: boolean;
}

export default function List({ list, index, updateListTitle, deleteList, addCard, deleteCard, openCard, isDragDisabled }: ListProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleUpdateTitle = () => {
    if (title.trim() && title !== list.title) {
      updateListTitle(list.id, title);
    } else {
      setTitle(list.title);
    }
    setIsEditingTitle(false);
  };

  const handleAddCard = async () => {
    if (newCardTitle.trim()) {
      await addCard(list.id, newCardTitle);
      setNewCardTitle("");
      setIsAddingCard(false);
    }
  };

  return (
    <Draggable draggableId={`list-${list.id}`} index={index} isDragDisabled={isDragDisabled}>
      {(provided) => (
        <div 
          className="w-[272px] shrink-0 bg-[#ebecf0] rounded-xl flex flex-col max-h-full"
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div 
            className="p-3 pb-2 font-semibold text-[#172b4d] flex justify-between items-center group"
            {...provided.dragHandleProps}
          >
            {isEditingTitle ? (
              <input
                ref={inputRef}
                className="text-sm px-1.5 py-1 font-semibold border-2 border-blue-500 rounded outline-none w-full"
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
              className="p-1 rounded-md hover:bg-black/10 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0"
              onClick={() => {
                if (confirm("Are you sure you want to delete this list?")) deleteList(list.id);
              }}
              title="Delete list"
            >
              <Trash2 size={16} />
            </button>
          </div>
          
          <Droppable droppableId={list.id.toString()} type="card">
            {(provided) => (
              <div 
                className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-2 min-h-[10px] custom-scrollbar"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {list.cards.map((card, idx) => (
                  <CardComponent key={card.id} card={card} index={idx} onClick={() => openCard(card.id)} isDragDisabled={isDragDisabled} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <div className="p-2 pt-0">
            {isAddingCard ? (
              <div className="flex flex-col gap-1.5 pt-2">
                <textarea
                  autoFocus
                  className="w-full px-2 py-1.5 text-sm rounded-lg shadow-sm outline-none resize-none border-none ring-2 ring-blue-500 text-[#172b4d]"
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
                    className="bg-[#0079bf] hover:bg-[#026aa7] text-white px-3 py-1.5 rounded text-sm font-medium"
                    onClick={handleAddCard}
                  >
                    Add card
                  </button>
                  <button 
                    className="p-1 text-gray-500 hover:text-gray-800 transition-colors"
                    onClick={() => setIsAddingCard(false)}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                className="text-[#5e6c84] hover:bg-black/10 hover:text-[#172b4d] w-full text-left p-1.5 rounded-md transition-colors text-sm font-medium flex items-center gap-1"
                onClick={() => setIsAddingCard(true)}
              >
                <Plus size={16} /> Add a card
              </button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
