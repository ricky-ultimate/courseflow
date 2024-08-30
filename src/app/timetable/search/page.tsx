"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Timetable from '@/components/Timetable';
import { dummyTimetableData } from '@/data/dummyData';

const SearchPage = () => {
  const searchParams = useSearchParams();  // Access query parameters
  const query = searchParams.get('query') || '';  // Get the 'query' parameter from the URL
  const [results, setResults] = useState(dummyTimetableData);  // Initialize with dummy data

  useEffect(() => {
    // Filter the timetable data based on the search query
    const filteredResults = dummyTimetableData.map((day) => ({
      ...day,
      courses: day.courses.filter(
        (course) =>
          course.name.toLowerCase().includes(query.toLowerCase()) ||
          course.code.toLowerCase().includes(query.toLowerCase())
      ),
    })).filter(day => day.courses.length > 0);

    setResults(filteredResults);
  }, [query]);

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Search Results for "{query}"</h2>
      {results.length > 0 ? (
        <Timetable data={results} />
      ) : (
        <p>No results found for "{query}".</p>
      )}
    </div>
  );
};

export default SearchPage;
