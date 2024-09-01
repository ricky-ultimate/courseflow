"use client";  // Ensure this component is a Client Component

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    if (query.toLowerCase() === 'cyber security') {
      router.push('/timetable/department/cyber-security');
    } else if (query.toLowerCase() === 'food science and technology') {
      router.push('/timetable/department/food-science-and-technology');
    } else if (query.toLowerCase() === 'biochemistry') {
      router.push('/timetable/department/biochemistry');
    } else {
      alert('Department not found!');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1e1e2e] text-[#f5e0dc]">
      <h1 className="text-4xl font-bold mb-6 text-[#f38ba8]">CourseFlow</h1> {/* CourseFlow Title */}
      <div className="bg-[#2e2e48] shadow-lg rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Search</h2>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter department name..."
          className="border border-[#585b70] p-2 rounded w-full mb-4 bg-[#2e2e48] text-[#f5e0dc]"
        />
        <button onClick={handleSearch} className="bg-[#f38ba8] text-[#1e1e2e] p-2 rounded w-full hover:bg-[#e5c3cf]">
          Search
        </button>
      </div>
    </div>
  );
};

export default SearchPage;
