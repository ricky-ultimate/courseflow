export interface Course {
    time: string;
    code: string;
    name: string;
    venue: string;
  }

  export interface DaySchedule {
    day: string;
    courses: Course[];
  }

  export interface Department {
    id: string;
    name: string;
    timetable: {
      '100lvl': DaySchedule[];
      '200lvl': DaySchedule[];
      '300lvl': DaySchedule[];
      '400lvl': DaySchedule[];
      '500lvl': DaySchedule[];
    };
  }

  export const departments: Record<string, Department[]> = {
    'university-a': [
      {
        id: 'cs',
        name: 'Computer Science',
        timetable: {
          '100lvl': [
            {
              day: 'Monday',
              courses: [
                { time: '09:00 - 10:00', code: 'CYB101', name: 'Introduction to Cyber Security', venue: 'Room 101' },
                { time: '11:00 - 12:00', code: 'CYB202', name: 'Network Security', venue: 'Room 102' },
              ],
            },
            {
              day: 'Tuesday',
              courses: [
                { time: '01:00 - 02:00', code: 'CYB303', name: 'Ethical Hacking', venue: 'Room 103' },
              ],
            },
            // Add more days as needed
          ],
          '200lvl': [
            {
              day: 'Monday',
              courses: [
                { time: '10:00 - 11:00', code: 'PRG201', name: 'Advanced Programming', venue: 'Room 201' },
                { time: '12:00 - 01:00', code: 'OS202', name: 'Operating Systems', venue: 'Room 202' },
              ],
            },
            // Add more days as needed
          ],
          '300lvl': [], // Add empty array for 300lvl
          '400lvl': [], // Add empty array for 400lvl
          '500lvl': [], // Add empty array for 500lvl
        },
      },
      {
        id: 'bio',
        name: 'Biology',
        timetable: {
          '100lvl': [
            {
              day: 'Monday',
              courses: [
                { time: '09:00 - 10:00', code: 'BIO101', name: 'General Biology', venue: 'Room 101' },
                { time: '11:00 - 12:00', code: 'GEN102', name: 'Genetics', venue: 'Room 102' },
              ],
            },
            {
              day: 'Wednesday',
              courses: [
                { time: '01:00 - 02:00', code: 'MOL103', name: 'Molecular Biology', venue: 'Room 103' },
              ],
            },
            // Add more days as needed
          ],
          '200lvl': [
            {
              day: 'Tuesday',
              courses: [
                { time: '10:00 - 11:00', code: 'BIO201', name: 'Biochemistry', venue: 'Room 201' },
                { time: '12:00 - 01:00', code: 'CEL202', name: 'Cell Biology', venue: 'Room 202' },
              ],
            },
            // Add more days as needed
          ],
          '300lvl': [], // Add empty array for 300lvl
          '400lvl': [], // Add empty array for 400lvl
          '500lvl': [], // Add empty array for 500lvl
        },
      },
      // Add more departments as needed
    ],
    'university-b': [
      // Add departments for another university
    ],
    // Add more universities as needed
  };
