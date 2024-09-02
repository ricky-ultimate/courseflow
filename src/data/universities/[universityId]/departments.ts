export interface Department {
    id: string;
    name: string;
    timetable: {
      '100lvl': string[];
      '200lvl': string[];
      '300lvl': string[];
      '400lvl': string[];
      '500lvl': string[];
    };
  }

  export const departments: Record<string, Department[]> = {
    'university-a': [
      {
        id: 'cs',
        name: 'Computer Science',
        timetable: {
          '100lvl': ['Introduction to Programming', 'Data Structures', 'Algorithms'],
          '200lvl': ['Advanced Programming', 'Operating Systems'],
          '300lvl': ['Database Systems', 'Computer Networks'],
          '400lvl': ['Artificial Intelligence', 'Machine Learning'],
          '500lvl': ['Advanced Topics in CS'],
        },
      },
      {
        id: 'bio',
        name: 'Biology',
        timetable: {
          '100lvl': ['General Biology', 'Genetics', 'Molecular Biology'],
          '200lvl': ['Biochemistry', 'Cell Biology'],
          '300lvl': ['Ecology', 'Evolution'],
          '400lvl': ['Marine Biology', 'Neuroscience'],
          '500lvl': ['Advanced Topics in Biology'],
        },
      },
      // Add more departments as needed
    ],
    'university-b': [
      // Add departments for another university
    ],
    // Add more universities as needed
  };
