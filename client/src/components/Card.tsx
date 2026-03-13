"use client";

import { Card as CardType } from "@/types";
import { Draggable } from "@hello-pangea/dnd";
import { Clock } from "lucide-react";
import { useState, useEffect } from "react";

export default function Card({
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
  onToggleComplete?: (id: number, currentStatus: boolean) => void;
}) {
  const [colorblindMode, setColorblindMode] = useState(false);

  useEffect(() => {
    const checkMode = () => {
      setColorblindMode(localStorage.getItem('colorblindMode') === 'true');
    };
    checkMode();
    window.addEventListener('storage', checkMode);
    return () => window.removeEventListener('storage', checkMode);
  }, []);

  const getPatternClass = (color: string) => {
    const c = color.toLowerCase();
    if (c.includes('green') || c === '#4bce97' || c === '#1f845a') return 'pattern-diagonal';
    if (c.includes('yellow') || c === '#f5cd47') return 'pattern-dots';
    if (c.includes('orange') || c === '#fea362') return 'pattern-waves';
    if (c.includes('red') || c === '#f87168' || c === '#ae2e24') return 'pattern-lines';
    if (c.includes('blue') || c === '#579dff' || c === '#0052cc') return 'pattern-vertical';
    if (c.includes('purple') || c === '#9f8fef') return 'pattern-checkered';
    return '';
  };
  const hasChecklist =
    typeof card.checklist_total === "number" && card.checklist_total > 0;
  const checklistText =
    hasChecklist && typeof card.checklist_completed === "number"
      ? `${card.checklist_completed}/${card.checklist_total}`
      : null;

  const due = card.due_date ? new Date(card.due_date) : null;
  const now = new Date();
  const isOverdue = !!due && due < now;
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const isDueSoon = !!due && !isOverdue && due <= in24Hours;

  return (
    <Draggable
      draggableId={`card-${card.id}`}
      index={index}
      isDragDisabled={isDragDisabled}
    >
      {(provided) => (
        <div
          className={`bg-[#22272b] rounded-md shadow-sm px-3 py-2 text-sm cursor-pointer hover:ring-2 hover:ring-[#579dff] text-white transition-all relative group ${
            isSelected ? "ring-2 ring-red-500 bg-red-900/20" : ""
          }`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
        >
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onClick={(e) => e.stopPropagation()}
              onChange={() => onToggleSelect(card.id)}
              className="absolute top-2 right-2 w-4 h-4 cursor-pointer z-10 accent-red-500"
            />
          )}

          {card.labels && card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {card.labels.map((label) => (
                <span
                  key={label.id}
                  className={`h-2 w-10 rounded-full ${colorblindMode ? getPatternClass(label.color) : ''}`}
                  style={{ backgroundColor: label.color }}
                ></span>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 mb-1.5">
            {onToggleComplete && (
              <input
                type="checkbox"
                checked={!!card.is_completed}
                onClick={(e) => e.stopPropagation()}
                onChange={() => onToggleComplete(card.id, !!card.is_completed)}
                className="w-4 h-4 mt-1 rounded-sm cursor-pointer accent-green-600 shrink-0 transition-opacity"
                title="Mark as complete"
              />
            )}
            <div className="text-sm flex-1 leading-snug text-white">{card.title}</div>
          </div>

          {(due || card.start_date || hasChecklist || (card.members && card.members.length > 0)) && (
            <div className="flex flex-col mt-2 gap-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2 min-h-[24px]">
                <div className="flex items-center gap-2 flex-wrap max-w-full">
                  {(due || card.start_date) && (
                    <span
                      className={`px-1.5 py-0.5 rounded-sm border text-[10px] flex items-center gap-1.5 ${
                        isOverdue && !card.is_completed
                          ? "bg-[#eb5a46] text-white border-[#eb5a46]"
                          : isDueSoon && !card.is_completed
                          ? "bg-[#f5cd47] text-[#1d2125] border-[#f5cd47]"
                          : card.is_completed ? "bg-[#1f845a] text-white border-[#1f845a]" : "bg-[#2c333a] text-white border-transparent"
                      } whitespace-nowrap`}
                    >
                      <Clock size={10} strokeWidth={2.5} />
                      <span className="flex items-center gap-1">
                        {card.start_date && due ? (() => {
                          const start = new Date(card.start_date);
                          const startMonth = start.toLocaleString(undefined, { month: 'short' });
                          const dueMonth = due.toLocaleString(undefined, { month: 'short' });
                          if (startMonth === dueMonth) {
                            return `${startMonth} ${start.getDate()}-${due.getDate()}`;
                          }
                          return `${startMonth} ${start.getDate()} - ${dueMonth} ${due.getDate()}`;
                        })() : due ? due.toLocaleString(undefined, { month: 'short', day: 'numeric' }) : ""}
                        
                        {due && (
                          <span className="opacity-90 ml-0.5">
                            {due.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </span>
                        )}
                        
                        {isOverdue && !card.is_completed && <span className="font-bold border-l border-white/30 pl-1 ml-1">OVERDUE</span>}
                        {isDueSoon && !card.is_completed && <span className="font-bold border-l border-black/30 pl-1 ml-1 uppercase text-black">DUE SOON</span>}
                      </span>
                    </span>
                  )}
                  {hasChecklist && checklistText && (
                    <span className="px-1.5 py-0.5 rounded-sm bg-[#596773] text-white flex items-center gap-1 text-[10px] font-medium whitespace-nowrap">
                      {checklistText}
                    </span>
                  )}
                </div>

                {card.members && card.members.length > 0 && (
                  <div className="flex -space-x-1.5 pt-0.5">
                    {card.members.slice(0, 6).map((m) => (
                      <div
                        key={m.id}
                        className="w-7 h-7 rounded-full bg-[#0052cc] text-white flex items-center justify-center text-[11px] font-bold border-2 border-[#22272b] hover:z-10 transition-transform hover:scale-110"
                        title={m.name}
                      >
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {card.members.length > 6 && (
                      <div className="w-7 h-7 rounded-full bg-[#3b444c] text-white flex items-center justify-center text-[10px] font-bold border-2 border-[#22272b]">
                        +{card.members.length - 6}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
