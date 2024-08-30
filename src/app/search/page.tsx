"use client"; // This marks the file as a Client Component

import React, { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import Timetable from '@/components/Timetable';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // Logic to handle the search and display results
  const handleSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    // Implement the search logic here and update `results`
  };

  return (
    <div className="container mx-auto p-4">
      <SearchBar onSearch={handleSearch} />
      <Timetable data={results} />
    </div>
  );
};

export default SearchPage;
