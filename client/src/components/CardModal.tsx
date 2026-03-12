"use client";
import { useState, useEffect } from "react";
import { X, AlignLeft, CheckSquare, Clock, Tag, User } from "lucide-react";

export default function CardModal({ cardId, onClose }: { cardId: number; onClose: () => void }) {
  const [card, setCard] = useState<any>(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/cards/${cardId}`)
      .then(res => res.json())
      .then(setCard);
  }, [cardId]);

  if (!card) return <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center"><div className="bg-white p-4 rounded text-black">Loading...</div></div>;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start pt-16 overflow-y-auto" onClick={onClose}>
      <div className="bg-[#f4f5f7] w-full max-w-3xl rounded-xl min-h-[500px] mb-16 relative flex p-6 gap-6" onClick={e => e.stopPropagation()}>
        <button className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-300 text-gray-600 transition-colors" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="flex-1 flex flex-col gap-8 text-[#172b4d]">
          <div className="flex gap-4 items-start">
             <div className="mt-1 flex-shrink-0 w-6"></div>
             <h2 className="text-xl font-bold">{card.title}</h2>
          </div>
          
          <div className="flex gap-4">
             <AlignLeft className="mt-1 flex-shrink-0" size={24} />
             <div className="flex-1">
               <h3 className="font-semibold text-lg mb-3">Description</h3>
               {card.description ? (
                 <p className="text-gray-700 bg-gray-200/50 p-3 rounded-lg leading-relaxed">{card.description}</p>
               ) : (
                 <button className="bg-gray-200/80 hover:bg-gray-300 px-4 py-3 rounded-lg text-[#172b4d] w-full text-left transition-colors font-medium">Add a more detailed description...</button>
               )}
             </div>
          </div>

          {card.checklists?.map((cl: any) => (
             <div key={cl.id} className="flex gap-4">
               <CheckSquare className="mt-1 flex-shrink-0" size={24} />
               <div className="flex-1">
                 <h3 className="font-semibold text-lg mb-3">{cl.title}</h3>
                 <div className="flex flex-col gap-2.5">
                   {cl.items?.map((item: any) => (
                     <div key={item.id} className="flex items-center gap-3 bg-white p-2 rounded shadow-sm border border-gray-100">
                       <input type="checkbox" checked={item.is_completed} readOnly className="w-4 h-4 rounded border-gray-300" />
                       <span className={item.is_completed ? "line-through text-gray-400" : ""}>{item.title}</span>
                     </div>
                   ))}
                   <button className="bg-gray-200/80 hover:bg-gray-300 px-3 py-1.5 rounded-md mt-2 text-sm w-fit font-medium transition-colors">Add an item</button>
                 </div>
               </div>
             </div>
          ))}
        </div>

        <div className="w-44 flex flex-col gap-2">
          <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 mt-10">Add to card</h4>
          <button className="bg-gray-200/80 hover:bg-gray-300 px-3 py-1.5 rounded-md text-sm flex items-center gap-2 text-[#172b4d] font-medium transition-colors"><User size={16}/> Members</button>
          <button className="bg-gray-200/80 hover:bg-gray-300 px-3 py-1.5 rounded-md text-sm flex items-center gap-2 text-[#172b4d] font-medium transition-colors"><Tag size={16}/> Labels</button>
          <button className="bg-gray-200/80 hover:bg-gray-300 px-3 py-1.5 rounded-md text-sm flex items-center gap-2 text-[#172b4d] font-medium transition-colors"><CheckSquare size={16}/> Checklist</button>
          <button className="bg-gray-200/80 hover:bg-gray-300 px-3 py-1.5 rounded-md text-sm flex items-center gap-2 text-[#172b4d] font-medium transition-colors"><Clock size={16}/> Dates</button>
        </div>
      </div>
    </div>
  );
}
