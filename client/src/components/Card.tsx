"use client";

import { Card as CardType } from "@/types";
import { Draggable } from "@hello-pangea/dnd";

export default function Card({ card, index, onClick, isDragDisabled }: { card: CardType, index: number, onClick: () => void, isDragDisabled?: boolean }) {
  return (
    <Draggable draggableId={`card-${card.id}`} index={index} isDragDisabled={isDragDisabled}>
      {(provided) => (
        <div 
          className="bg-white p-2.5 rounded-lg shadow-sm cursor-pointer hover:ring-2 hover:ring-[#0079bf] text-[#172b4d]"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
        >
          {card.labels && card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {card.labels.map(label => (
                <span key={label.id} className="h-2 w-10 rounded-full" style={{ backgroundColor: label.color }}></span>
              ))}
            </div>
          )}
          <div className="text-sm">{card.title}</div>
        </div>
      )}
    </Draggable>
  );
}
