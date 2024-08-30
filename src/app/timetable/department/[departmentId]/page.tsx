import React from 'react';
import { useRouter } from 'next/router';
import cyberSecurityTimetable from '@/data/cyber-security/timetable';
import foodScienceTimetable from '@/data/food-science-and-technology/timetable';
import biochemistryTimetable from '@/data/biochemistry/timetable';
import Timetable from '@/components/Timetable';

const departmentDataMap: Record<string, any> = {
  'cyber-security': cyberSecurityTimetable,
  'food-science-and-technology': foodScienceTimetable,
  'biochemistry': biochemistryTimetable,
};

const DepartmentTimetablePage = () => {
  const router = useRouter();
  const { departmentId } = router.query;

  const timetableData = departmentId ? departmentDataMap[departmentId as string] : null;

  if (!timetableData) {
    return <p>Timetable data not found for this department.</p>;
  }

  return <Timetable data={timetableData} />;
};

export default DepartmentTimetablePage;
