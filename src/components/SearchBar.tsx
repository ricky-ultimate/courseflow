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
        className="border border-[#575268] rounded-l-lg p-4 w-full text-[#F5E0DC] bg-[#302D41] text-lg placeholder-[#988BA2]"
        placeholder="Search for a course or department..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
      />
      <button
        onClick={handleSearch}
        className="bg-[#F38BA8] text-[#1E1E2E] p-4 rounded-r-lg hover:bg-[#E58C98] text-lg"
      >
        Search
      </button>
    </div>
  );
};

export default SearchBar;
