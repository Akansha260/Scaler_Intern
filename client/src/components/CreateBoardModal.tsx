"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { apiUrl } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function CreateBoardModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl("boards"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });

      if (res.ok) {
        const board = await res.json();
        router.push(`/boards/${board.id}`);
        onClose();
      }
    } catch (error) {
      console.error("Error creating board:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h3 className="font-semibold text-[#172b4d]">Create board</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-500">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="board-title" className="text-xs font-bold text-gray-700">
              Board title <span className="text-red-500">*</span>
            </label>
            <input
              id="board-title"
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter board title"
              className="w-full border-2 border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none transition-colors text-black"
              required
            />
            <p className="text-[11px] text-gray-500">
              👋 Board title is required
            </p>
          </div>
          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="w-full bg-[#0079bf] hover:bg-[#026aa7] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 rounded font-medium text-sm transition-colors"
          >
            {isSubmitting ? "Creating..." : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
}
