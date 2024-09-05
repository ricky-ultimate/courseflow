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
      '100 Level': DaySchedule[];
      '200 Level': DaySchedule[];
      '300 Level': DaySchedule[];
      '400 Level': DaySchedule[];
      '500 Level': DaySchedule[];
    };
  }

  export interface University {
    id: string;
    name: string;
    departments: Department[];
  }
