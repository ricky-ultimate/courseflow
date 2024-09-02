"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import universities from '@/data/universities';

const UniversityPage = ({ params }) => {
  const router = useRouter();
  const universityId = params.universityId;
  const university = universities.find(uni => uni.id === universityId);

  if (!university) {
    return <div>University not found</div>;
  }

  const { departments } = university;

  return (
    <div className="min-h-screen p-8 bg-black text-mocha">
      <h1 className="text-3xl font-bold mb-6">{university.name}</h1>
      <input
        type="text"
        placeholder="Search Department"
        className="w-full p-4 rounded-lg text-black mb-6"
      />
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <li
            key={dept.id}
            onClick={() => router.push(`/university/${universityId}/department/${dept.id}`)}
            className="cursor-pointer p-4 bg-mocha text-white rounded-md"
          >
            {dept.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UniversityPage;
