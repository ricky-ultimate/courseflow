"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import Timetable from '@/components/Timetable';
import { dummyTimetableData } from '@/data/dummyData';

const HomePage = () => {
  const router = useRouter();  // Use Next.js router for navigation

  const handleSearch = (searchTerm: string) => {
    // Redirect the user to the /search page with the search term as a query parameter
    router.push(`/search?query=${searchTerm}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">CourseFlow - University Timetable</h1>
      <SearchBar onSearch={handleSearch} />
      <Timetable data={dummyTimetableData} />
    </div>
  );
};

export default HomePage;
