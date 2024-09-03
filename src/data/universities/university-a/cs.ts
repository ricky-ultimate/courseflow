import { Department } from '@/data/universities/types';

export const cs: Department = {
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
    ],
    '200lvl': [
      {
        day: 'Monday',
        courses: [
          { time: '10:00 - 11:00', code: 'PRG201', name: 'Advanced Programming', venue: 'Room 201' },
          { time: '12:00 - 01:00', code: 'OS202', name: 'Operating Systems', venue: 'Room 202' },
        ],
      },
    ],
    '300lvl': [],
    '400lvl': [],
    '500lvl': [],
  },
};

export default cs;
