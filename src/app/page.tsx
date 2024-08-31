"use client";

import React from 'react';
import SearchBar from '@/components/SearchBar';

const HomePage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-6 bg-white shadow-lg rounded-lg">
        <h1 className="text-4xl font-bold text-center text-black mb-6">Search for a Course or Department</h1>
        <SearchBar onSearch={(query) => { /* Handle search action here */ }} />
      </div>
    </div>
  );
};

export default HomePage;
