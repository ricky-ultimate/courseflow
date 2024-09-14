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
    const [level, setLevel] = useState<'100 Level' | '200 Level' | '300 Level' | '400 Level' | '500 Level'>('100 Level');
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
      return <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto my-20"></div>;
    }

    const timetableData = department.timetable[level];

    return (
      <div className="min-h-screen p-8 bg-black text-mocha">
        <h1 className="text-3xl font-bold mb-6">{department.name} - {level}</h1>
        <div className="mb-6">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as '100 Level' | '200 Level' | '300 Level' | '400 Level' | '500 Level')}
            className="p-4 rounded-lg text-black"
          >
            <option value="100 Level">100 Level</option>
            <option value="200 Level">200 Level</option>
            <option value="300 Level">300 Level</option>
            <option value="400 Level">400 Level</option>
            <option value="500 Level">500 Level</option>
          </select>
        </div>
        <Timetable department={department} data={timetableData} level={level} />
      </div>
    );
  };

  export default DepartmentPage;
