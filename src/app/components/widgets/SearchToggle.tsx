import React from "react";
import { LayoutGrid, List, Search, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "../ui/utils";


interface SearchToggleProps {
  view: "grid" | "list";
  setView: React.Dispatch<React.SetStateAction<"grid" | "list">>;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  placeholder?: string;
}

export const SearchToggle = ({ view, setView, search, setSearch, placeholder = "بحث بالاسم أو الدور أو الهاتف..." }: SearchToggleProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
        <button onClick={() => setView("grid")} className={cn("p-2 transition-colors", view === "grid" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50")}>
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button onClick={() => setView("list")} className={cn("p-2 transition-colors", view === "list" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50")}>
          <List className="w-4 h-4" />
        </button>
      </div>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder={placeholder}
          className="pr-9 bg-white border-gray-200"
          value={search}
          onChange={e => setSearch(e.target.value)}
          dir="rtl"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};