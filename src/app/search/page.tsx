import React, { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import Timetable from '@/components/Timetable';

const SearchPage = () => {
  const [searchResults, setSearchResults] = useState(null);

  const handleSearch = async (query: string) => {
    // Placeholder for search API integration
    const response = await fetch(`/api/search?query=${query}`);
    const data = await response.json();
    setSearchResults(data);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Search Timetable</h1>
      <SearchBar onSearch={handleSearch} />
      {searchResults && (
        <div className="mt-6">
          <Timetable data={searchResults} />
        </div>
      )}
    </div>
  );
};

export default SearchPage;
