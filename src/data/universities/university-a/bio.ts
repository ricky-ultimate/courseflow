import { Department } from '@/data/universities/types';

export const bio: Department = {
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
    ],
    '200lvl': [
      {
        day: 'Tuesday',
        courses: [
          { time: '10:00 - 11:00', code: 'BIO201', name: 'Biochemistry', venue: 'Room 201' },
          { time: '12:00 - 01:00', code: 'CEL202', name: 'Cell Biology', venue: 'Room 202' },
        ],
      },
    ],
    '300lvl': [],
    '400lvl': [],
    '500lvl': [],
  },
};
