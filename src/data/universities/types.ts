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

  export interface University {
    id: string;
    name: string;
    departments: Department[];
  }
