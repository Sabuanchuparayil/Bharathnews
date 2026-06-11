import React from 'react';
import { CATEGORIES } from '../config/feeds.config';

const CategoryFilter = ({ onCategoryChange, activeCategory = 'all' }) => {
  return (
    <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
      {CATEGORIES.map(cat => (
        <button
          key={cat.id}
          onClick={() => onCategoryChange(cat.id)}
          className={`category-pill whitespace-nowrap ${
            activeCategory === cat.id ? 'category-pill-active' : 'category-pill-inactive'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
