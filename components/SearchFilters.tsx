import React from 'react';
import { X } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  emoji: string;
}

interface SearchFiltersProps {
  selectedFilters: string[];
  onFilterChange: (filters: string[]) => void;
}

const FILTERS: FilterOption[] = [
  { id: 'summary', label: 'Has Summary', emoji: '📋' },
  { id: 'transcript', label: 'Has Transcript', emoji: '🎙️' },
  { id: 'audio', label: 'Audio Notes', emoji: '🎵' },
  { id: 'image', label: 'Image Notes', emoji: '📷' },
];

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  selectedFilters,
  onFilterChange,
}) => {
  const toggleFilter = (filterId: string) => {
    onFilterChange(
      selectedFilters.includes(filterId)
        ? selectedFilters.filter(f => f !== filterId)
        : [...selectedFilters, filterId]
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => (
        <button
          key={filter.id}
          onClick={() => toggleFilter(filter.id)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            selectedFilters.includes(filter.id)
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <span>{filter.emoji}</span>
          <span>{filter.label}</span>
          {selectedFilters.includes(filter.id) && (
            <X size={14} className="ml-1" />
          )}
        </button>
      ))}
    </div>
  );
};
