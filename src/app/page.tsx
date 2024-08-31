"use client";

import React from 'react';
import { useRouter } from 'next/navigation';  // Import useRouter for navigation
import SearchBar from '@/components/SearchBar';

const HomePage = () => {
  const router = useRouter();

  const departmentMap: Record<string, string> = {
    'cyber security': '/timetable/department/cyber-security',
    'food science and technology': '/timetable/department/food-science-and-technology',
    'biochemistry': '/timetable/department/biochemistry',
  };

  const handleSearch = (query: string) => {
    const normalizedQuery = query.toLowerCase().trim();

    const departmentUrl = departmentMap[normalizedQuery];

    if (departmentUrl) {
      router.push(departmentUrl);
    } else {
      alert('Department not found!');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1E1E2E]">
      <div className="w-full max-w-lg p-6 bg-[#1A1826] shadow-lg rounded-lg">
        <h1 className="text-4xl font-bold text-center text-[#F5E0DC] mb-6">
          Search for a Course or Department
        </h1>
        <SearchBar onSearch={handleSearch} />
      </div>
    </div>
  );
};

export default HomePage;
