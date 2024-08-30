import React, { useState } from 'react';
import { useRouter } from 'next/router';

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
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Search Timetable</h2>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter department name..."
        className="border p-2 rounded w-full mb-4"
      />
      <button onClick={handleSearch} className="bg-blue-500 text-white p-2 rounded">
        Search
      </button>
    </div>
  );
};

export default SearchPage;
