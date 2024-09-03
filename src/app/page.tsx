"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import universities from '@/data/universities/index';

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const filteredUniversities = universities.filter(uni =>
    uni.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredUniversities.length === 1) {
      router.push(`/university/${filteredUniversities[0].id}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-mocha">
      <h1 className="text-4xl font-bold mb-6">Find Your University</h1>
      <form onSubmit={handleSearch} className="w-full max-w-md">
        <input
          type="text"
          placeholder="Search University"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-4 rounded-lg text-black"
        />
        <ul className="mt-4">
          {filteredUniversities.map((uni) => (
            <li
              key={uni.id}
              onClick={() => router.push(`/university/${uni.id}`)}
              className="cursor-pointer p-2 bg-mocha text-white rounded-md mb-2"
            >
              {uni.name}
            </li>
          ))}
        </ul>
      </form>
    </div>
  );
};

export default HomePage;
