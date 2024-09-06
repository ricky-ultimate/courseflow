import React from 'react';
import Link from 'next/link'; // Use Link instead of useRouter
import { Department, DaySchedule } from '@/data/universities/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Import the plugin

interface TimetableProps {
  department: Department;
  data: DaySchedule[];
  level: string; // Add level as a prop
}

const Timetable: React.FC<TimetableProps> = ({ department, data, level }) => {

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${department.name} Timetable - ${level}`, 14, 22); // Include level in the PDF title

    let lastY = 30;

    data.forEach((daySchedule) => {
      doc.setFontSize(14);
      doc.text(daySchedule.day, 14, lastY + 10);

      const tableData = daySchedule.courses.map((course) => [
        course.time,
        course.code,
        course.name,
        course.venue,
      ]);

      autoTable(doc, {
        startY: lastY + 15,
        head: [['Time', 'Course Code', 'Course Name', 'Venue']],
        body: tableData,
      });

      lastY = (doc as any).lastAutoTable.finalY || lastY + 30;
    });

    // Include department name and level in the file name
    doc.save(`${department.name}_Timetable_${level}.pdf`);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{department.name} Timetable - {level}</h2>
        <div className="flex space-x-4">
          <button
            onClick={generatePDF}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Save as PDF
          </button>
          <Link href="/complaints" passHref>
            <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
              Report Complaint
            </button>
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {data.map((item, index) => (
          <div key={index} className="border p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2 text-black">{item.day}</h3>
            {item.courses.map((course, courseIndex) => (
              <div key={courseIndex} className="mb-2">
                <p className="font-medium text-black">{course.time}</p>
                <p className="text-black">{course.code}: {course.name}</p>
                <p className="text-sm text-gray-600">{course.venue}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timetable;
