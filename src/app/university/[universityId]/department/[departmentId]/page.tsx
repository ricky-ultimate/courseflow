"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Timetable from '@/components/Timetable';
import { Department } from '@/data/universities/types';

interface DepartmentPageParams {
  universityId: string;
  departmentId: string;
}

const DepartmentPage: React.FC<{ params: DepartmentPageParams }> = ({ params }) => {
    const { universityId, departmentId } = params;
    const [department, setDepartment] = useState<Department | null>(null);
    const [level, setLevel] = useState<'100lvl' | '200lvl' | '300lvl' | '400lvl' | '500lvl'>('100lvl');
    const router = useRouter();

    useEffect(() => {
      const loadDepartmentData = async () => {
        try {
          const departmentModule = await import(`@/data/universities/${universityId}/${departmentId}`);
          setDepartment(departmentModule.default);
        } catch (error) {
          console.error("Error loading department data:", error);
          router.push(`/university/${universityId}`);
        }
      };

      loadDepartmentData();
    }, [universityId, departmentId, router]);

    if (!department) {
      return <div>Loading...</div>;
    }

    const timetableData = department.timetable[level];

    return (
      <div className="min-h-screen p-8 bg-black text-mocha">
        <h1 className="text-3xl font-bold mb-6">{department.name} - {level}</h1>
        <div className="mb-6">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as '100lvl' | '200lvl' | '300lvl' | '400lvl' | '500lvl')}
            className="p-4 rounded-lg text-black"
          >
            <option value="100lvl">100lvl</option>
            <option value="200lvl">200lvl</option>
            <option value="300lvl">300lvl</option>
            <option value="400lvl">400lvl</option>
            <option value="500lvl">500lvl</option>
          </select>
        </div>
        <Timetable department={department} data={timetableData} />
      </div>
    );
  };

  export default DepartmentPage;
