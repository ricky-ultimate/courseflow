export interface Course {
    time: string;
    code: string;
    name: string;
    venue: string;
  }

  export interface Department {
    id: string;
    name: string;
    timetable: {
      '100lvl': Course[];
      '200lvl': Course[];
      '300lvl': Course[];
      '400lvl': Course[];
      '500lvl': Course[];
    };
  }


  export const departments: Record<string, Department[]> = {
    'university-a': [
      {
        id: 'cs',
        name: 'Computer Science',
        timetable: {
          '100lvl': [
            { time: '09:00 - 10:00', code: 'CYB101', name: 'Introduction to Cyber Security', venue: 'Room 101' },
            { time: '11:00 - 12:00', code: 'CYB202', name: 'Network Security', venue: 'Room 102' },
            { time: '01:00 - 02:00', code: 'CYB303', name: 'Ethical Hacking', venue: 'Room 103' },
          ],
          '200lvl': [
            { time: '10:00 - 11:00', code: 'PRG201', name: 'Advanced Programming', venue: 'Room 201' },
            { time: '12:00 - 01:00', code: 'OS202', name: 'Operating Systems', venue: 'Room 202' },
          ],
          '300lvl': [
            { time: '09:00 - 10:00', code: 'DBS301', name: 'Database Systems', venue: 'Room 301' },
            { time: '11:00 - 12:00', code: 'CNET302', name: 'Computer Networks', venue: 'Room 302' },
          ],
          '400lvl': [
            { time: '10:00 - 11:00', code: 'AI401', name: 'Artificial Intelligence', venue: 'Room 401' },
            { time: '01:00 - 02:00', code: 'ML402', name: 'Machine Learning', venue: 'Room 402' },
          ],
          '500lvl': [
            { time: '10:00 - 11:00', code: 'ADV501', name: 'Advanced Topics in CS', venue: 'Room 501' },
          ],
        },
      },
      {
        id: 'bio',
        name: 'Biology',
        timetable: {
          '100lvl': [
            { time: '09:00 - 10:00', code: 'BIO101', name: 'General Biology', venue: 'Room 101' },
            { time: '11:00 - 12:00', code: 'GEN102', name: 'Genetics', venue: 'Room 102' },
            { time: '01:00 - 02:00', code: 'MOL103', name: 'Molecular Biology', venue: 'Room 103' },
          ],
          '200lvl': [
            { time: '10:00 - 11:00', code: 'BIO201', name: 'Biochemistry', venue: 'Room 201' },
            { time: '12:00 - 01:00', code: 'CEL202', name: 'Cell Biology', venue: 'Room 202' },
          ],
          '300lvl': [
            { time: '09:00 - 10:00', code: 'ECO301', name: 'Ecology', venue: 'Room 301' },
            { time: '11:00 - 12:00', code: 'EVO302', name: 'Evolution', venue: 'Room 302' },
          ],
          '400lvl': [
            { time: '10:00 - 11:00', code: 'MAR401', name: 'Marine Biology', venue: 'Room 401' },
            { time: '01:00 - 02:00', code: 'NEU402', name: 'Neuroscience', venue: 'Room 402' },
          ],
          '500lvl': [
            { time: '10:00 - 11:00', code: 'ADV501', name: 'Advanced Topics in Biology', venue: 'Room 501' },
          ],
        },
      },
      // Add more departments as needed
    ],
    'university-b': [
      // Add departments for another university
    ],
    // Add more universities as needed
  };
