export interface Department {
    id: string;
    name: string;
    courses: string[];
  }

export const departments = [
    {
      id: 'cs',
      name: 'Computer Science',
      courses: ['Introduction to Programming', 'Data Structures', 'Algorithms'],
    },
    {
      id: 'bio',
      name: 'Biology',
      courses: ['General Biology', 'Genetics', 'Molecular Biology'],
    },
    // Add more departments as needed
  ];
