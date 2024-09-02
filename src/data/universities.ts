const universities = [
    {
      id: 'university-a',
      name: 'University A',
      departments: [
        {
          id: 'cyb',
          name: 'Cyber Security',
          timetable: {
            '100lvl': [ { time: '09:00 - 10:00', code: 'CYB101', name: 'Introduction to Cyber Security', venue: 'Room 101' },
            { time: '11:00 - 12:00', code: 'CYB202', name: 'Network Security', venue: 'Room 102' },
            { time: '01:00 - 02:00', code: 'CYB303', name: 'Ethical Hacking', venue: 'Room 103' },], // Array of timetable data
            '200lvl': [ { time: '10:00 - 11:00', code: 'CYB204', name: 'Cryptography', venue: 'Room 201' },
            { time: '12:00 - 01:00', code: 'CYB305', name: 'Digital Forensics', venue: 'Room 202' },],
            // Add other levels
          },
        },

        {
          id: 'cs',
          name: 'Computer Science',
          timetable: {
            '100lvl': [ { time: '09:00 - 10:00', code: 'CYB101', name: 'Introduction to Cyber Security', venue: 'Room 101' },
            { time: '11:00 - 12:00', code: 'CYB202', name: 'Network Security', venue: 'Room 102' },
            { time: '01:00 - 02:00', code: 'CYB303', name: 'Ethical Hacking', venue: 'Room 103' },], // Array of timetable data
            '200lvl': [ { time: '10:00 - 11:00', code: 'CYB204', name: 'Cryptography', venue: 'Room 201' },
            { time: '12:00 - 01:00', code: 'CYB305', name: 'Digital Forensics', venue: 'Room 202' },],
            // Add other levels
          },

        },
        // Add other departments
      ],
    },
    {
        id: 'university-b',
        name: 'University B',
        departments: [
          {
            id: 'physical-security',
            name: 'Physical Security',
            timetable: {
              '100lvl': [ { time: '09:00 - 10:00', code: 'CYB101', name: 'Introduction to Cyber Security', venue: 'Room 101' },
              { time: '11:00 - 12:00', code: 'CYB202', name: 'Network Security', venue: 'Room 102' },
              { time: '01:00 - 02:00', code: 'CYB303', name: 'Ethical Hacking', venue: 'Room 103' },], // Array of timetable data
              '200lvl': [ { time: '10:00 - 11:00', code: 'CYB204', name: 'Cryptography', venue: 'Room 201' },
              { time: '12:00 - 01:00', code: 'CYB305', name: 'Digital Forensics', venue: 'Room 202' },],
              // Add other levels
            },
          },

          {
            id: 'es',
            name: 'Electronic? Science',
            timetable: {
              '100lvl': [ { time: '09:00 - 10:00', code: 'CYB101', name: 'Introduction to Cyber Security', venue: 'Room 101' },
              { time: '11:00 - 12:00', code: 'CYB202', name: 'Network Security', venue: 'Room 102' },
              { time: '01:00 - 02:00', code: 'CYB303', name: 'Ethical Hacking', venue: 'Room 103' },], // Array of timetable data
              '200lvl': [ { time: '10:00 - 11:00', code: 'CYB204', name: 'Cryptography', venue: 'Room 201' },
              { time: '12:00 - 01:00', code: 'CYB305', name: 'Digital Forensics', venue: 'Room 202' },],
              // Add other levels
            },

          },
          // Add other departments
        ],
      },
    // Add other universities
  ];

  export default universities;
