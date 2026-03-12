"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface ConfirmPopoverProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  variant?: "danger" | "primary";
}

export default function ConfirmPopover({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
  variant = "danger",
}: ConfirmPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/5 z-[100] flex justify-center items-center">
      <div 
        ref={popoverRef}
        className="bg-white rounded-lg shadow-2xl w-[300px] overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-150"
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-[#44546f] w-full text-center">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-[#44546f] absolute right-2">
            <X size={14} />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <p className="text-sm text-[#172b4d] leading-relaxed">
            {message}
          </p>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`w-full py-2 rounded font-medium text-sm transition-colors ${
              variant === "danger" 
                ? "bg-[#ae2e24] hover:bg-[#c9372c] text-white" 
                : "bg-[#0c66e4] hover:bg-[#0055cc] text-white"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
