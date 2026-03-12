import { memo } from "react";
import { Card as CardType } from "@/types";
import { Draggable } from "@hello-pangea/dnd";

const Card = memo(function Card({
  card,
  index,
  onClick,
  isDragDisabled,
  isSelected,
  onToggleSelect,
  onToggleComplete,
}: {
  card: CardType;
  index: number;
  onClick: () => void;
  isDragDisabled?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
  onToggleComplete?: (id: number, status: boolean) => void;
}) {
  const hasChecklist =
    typeof card.checklist_total === "number" && card.checklist_total > 0;
  const checklistText =
    hasChecklist && typeof card.checklist_completed === "number"
      ? `${card.checklist_completed}/${card.checklist_total}`
      : null;

  const due = card.due_date ? new Date(card.due_date) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = !!due && due < today;

  return (
    <Draggable
      draggableId={`card-${card.id}`}
      index={index}
      isDragDisabled={isDragDisabled}
    >
      {(provided, snapshot) => (
        <div
          className={`bg-white rounded-md shadow-sm px-3 py-2 text-sm cursor-pointer border border-transparent hover:border-[#0079bf] text-[#172b4d] relative group transition-[background-color,border-color,box-shadow,ring] duration-200 ${
            isSelected ? "ring-2 ring-red-500 bg-red-50" : ""
          } ${snapshot.isDragging ? "dragging shadow-xl ring-2 ring-[#0079bf]" : ""}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          style={provided.draggableProps.style}
        >
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onClick={(e) => e.stopPropagation()}
              onChange={() => onToggleSelect(card.id)}
              className={`absolute top-2 right-2 w-4 h-4 cursor-pointer z-10 accent-red-500 transition-opacity ${
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            />
          )}

          {card.labels && card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {card.labels.map((label) => (
                <span
                  key={label.id}
                  className="h-2 w-10 rounded-full"
                  style={{ backgroundColor: label.color }}
                ></span>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 pr-6 mb-1.5">
            {onToggleComplete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleComplete(card.id, card.is_completed || false);
                }}
                className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 transition-colors flex items-center justify-center ${
                  card.is_completed
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {card.is_completed && <span className="text-[10px] leading-none">✓</span>}
              </button>
            )}
            <div className={`text-sm ${card.is_completed ? "line-through text-gray-500" : ""}`}>
              {card.title}
            </div>
          </div>

          {(due || hasChecklist || (card.members && card.members.length > 0)) && (
            <div className="flex items-center justify-between mt-1 gap-2">
              <div className="flex items-center gap-1 text-[11px]">
                {due && (
                  <span
                    className={`px-1.5 py-0.5 rounded-sm border text-[10px] ${
                      isOverdue
                        ? "bg-[#eb5a46] text-white border-[#eb5a46]"
                        : "bg-[#e2f3ff] text-[#172b4d] border-transparent"
                    }`}
                  >
                    {due.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
                {hasChecklist && checklistText && (
                  <span className="px-1.5 py-0.5 rounded-sm bg-[#e4f0f6] text-[#172b4d] border border-transparent">
                    ☑ {checklistText}
                  </span>
                )}
              </div>

              {card.members && card.members.length > 0 && (
                <div className="flex -space-x-1">
                  {card.members.slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      className="w-6 h-6 rounded-full bg-[#0052cc] text-white flex items-center justify-center text-[10px] font-bold border-2 border-white"
                      title={m.name}
                    >
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
});
export default Card;
