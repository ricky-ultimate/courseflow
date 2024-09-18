"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import universities from '@/data/universities/index';

interface DepartmentListPageParams {
  universityId: string;
}

interface DepartmentListPageProps {
  params: DepartmentListPageParams;
}

const DepartmentListPage: React.FC<DepartmentListPageProps> = ({ params }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const universityId = params.universityId;
  const university = universities.find(uni => uni.id === universityId);

  if (!university) {
    return <div>University not found</div>;
  }

  const { departments } = university;

  const filteredDepartments = departments.filter(dpt =>
    dpt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredDepartments.length === 1) {
      router.push(`/university/${universityId}/department/${filteredDepartments[0].id}`);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-black text-mocha">
      <h1 className="text-3xl font-bold mb-6">{university.name}</h1>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search Department"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-4 rounded-lg text-black mb-6"
        />
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredDepartments.map((dept) => (
            <li
              key={dept.id}
              onClick={() => router.push(`/university/${universityId}/department/${dept.id}`)}
              className="cursor-pointer p-4 bg-mocha text-white rounded-md"
            >
              {dept.name}
            </li>
          ))}
        </ul>
      </form>
    </div>
  );
};

export default DepartmentListPage;
