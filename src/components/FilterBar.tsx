import React from 'react';
import { Search, X, Flame, Sparkles, Gamepad2, Award } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  totalApps: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  totalApps
}) => {
  const categories = [
    { id: 'all', label: 'All Apps', icon: Sparkles },
    { id: 'trending', label: 'Trending', icon: Flame },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'vip', label: 'VIP Club', icon: Award }
  ];

  return (
    <div className="filter-section">
      {/* Search Input Box */}
      <div className="search-box">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search apps or games (e.g. Fomo, Classic, Fifa)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Categories Bar */}
      <div className="categories-row">
        <div className="category-chips">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                className={`category-chip ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="apps-count-pill">
          <span>{totalApps} Verified Apps</span>
        </div>
      </div>
    </div>
  );
};
