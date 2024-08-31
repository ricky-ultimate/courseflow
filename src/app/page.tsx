"use client";

import React from 'react';
import SearchBar from '@/components/SearchBar';

const HomePage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1E1E2E]"> {/* Dark background */}
      <div className="w-full max-w-lg p-6 bg-[#1A1826] shadow-lg rounded-lg"> {/* Slightly lighter dark background */}
        <h1 className="text-4xl font-bold text-center text-[#F5E0DC] mb-6"> {/* Latte color */}
          Search for a Course or Department
        </h1>
        <SearchBar onSearch={(query) => { /* Handle search action here */ }} />
      </div>
    </div>
  );
};

export default HomePage;
