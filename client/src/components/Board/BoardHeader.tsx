"use client";
import { Filter, Archive, Trash2 } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import FilterPopover, { FilterState } from "../FilterPopover";

interface BoardHeaderProps {
  isFiltering: boolean;
  activeFilterCount: number;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  filter: FilterState;
  setFilter: Dispatch<SetStateAction<FilterState>>;
  allLabels: any[];
  allMembers: any[];
  setIsArchiveOpen: (open: boolean) => void;
  setShowDeleteBoardConfirm: (show: boolean) => void;
}

export default function BoardHeader({
  isFiltering,
  activeFilterCount,
  isFilterOpen,
  setIsFilterOpen,
  filter,
  setFilter,
  allLabels,
  allMembers,
  setIsArchiveOpen,
  setShowDeleteBoardConfirm
}: BoardHeaderProps) {
  return (
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

      <button 
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-red-500/80 hover:bg-red-600 text-white ml-2"
        onClick={() => setShowDeleteBoardConfirm(true)}
      >
        <Trash2 size={16} /> Delete Board
      </button>
    </div>
  );
}
