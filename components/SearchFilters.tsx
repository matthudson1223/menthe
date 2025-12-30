import React from 'react';
import { X, FileText, Mic, Music, Image } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface SearchFiltersProps {
  selectedFilters: string[];
  onFilterChange: (filters: string[]) => void;
}

const FILTERS: FilterOption[] = [
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'transcript', label: 'Transcript', icon: Mic },
  { id: 'audio', label: 'Audio', icon: Music },
  { id: 'image', label: 'Image', icon: Image },
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
    <div className="flex flex-wrap gap-1.5">
      {FILTERS.map((filter) => {
        const Icon = filter.icon;
        const isSelected = selectedFilters.includes(filter.id);
        return (
          <button
            key={filter.id}
            onClick={() => toggleFilter(filter.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              isSelected
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Icon size={12} />
            <span>{filter.label}</span>
            {isSelected && (
              <X size={12} className="ml-0.5 opacity-60" />
            )}
          </button>
        );
      })}
    </div>
  );
};
