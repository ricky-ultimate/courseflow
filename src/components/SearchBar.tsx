import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <div className="flex items-center">
      <input
        type="text"
        className="border border-gray-300 rounded-l-lg p-4 w-full text-black text-lg"
        placeholder="Search for a course or department..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
      />
      <button
        onClick={handleSearch}
        className="bg-blue-500 text-white p-4 rounded-r-lg hover:bg-blue-600 text-lg"
      >
        Search
      </button>
    </div>
  );
};

export default SearchBar;
