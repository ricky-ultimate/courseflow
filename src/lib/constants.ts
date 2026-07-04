import {
  College,
  DayOfWeek,
  Level,
  Role,
  SessionType,
  VenueType,
} from "@/types";

export const LEVEL_PILL: Record<Level, string> = {
  [Level.LEVEL_100]: "bg-slate-100 text-slate-700",
  [Level.LEVEL_200]: "bg-blue-100 text-blue-700",
  [Level.LEVEL_300]: "bg-violet-100 text-violet-700",
  [Level.LEVEL_400]: "bg-orange-100 text-orange-700",
  [Level.LEVEL_500]: "bg-red-100 text-red-700",
};

export const COLLEGE_BADGE: Record<College, string> = {
  [College.CBAS]: "bg-blue-100 text-blue-700 border-blue-200",
  [College.CHMS]: "bg-purple-100 text-purple-700 border-purple-200",
  [College.CAHS]: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export const COLLEGE_NAMES: Record<College, string> = {
  [College.CBAS]: "College of Basic & Applied Sciences",
  [College.CHMS]: "College of Humanities & Management Sciences",
  [College.CAHS]: "College of Allied Health Sciences",
};

export const LEVEL_OPTIONS = [
  { value: Level.LEVEL_100, label: "100 Level" },
  { value: Level.LEVEL_200, label: "200 Level" },
  { value: Level.LEVEL_300, label: "300 Level" },
  { value: Level.LEVEL_400, label: "400 Level" },
  { value: Level.LEVEL_500, label: "500 Level" },
];

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  [SessionType.THEORY]: "Theory",
  [SessionType.PRACTICAL]: "Practical",
};

export const VENUE_LABELS: Record<VenueType, string> = {
  [VenueType.UNIVERSITY_ICT_CENTER]: "University ICT Centre",
  [VenueType.ICT_LAB_1]: "ICT Lab 1",
  [VenueType.ICT_LAB_2]: "ICT Lab 2",
  [VenueType.COMPUTER_LAB]: "Computer Lab",
  [VenueType.LECTURE_HALL_1]: "Lecture Hall 1",
  [VenueType.LECTURE_HALL_2]: "Lecture Hall 2",
  [VenueType.LECTURE_HALL_3]: "Lecture Hall 3",
  [VenueType.AUDITORIUM_A]: "Auditorium A",
  [VenueType.AUDITORIUM_B]: "Auditorium B",
  [VenueType.SEMINAR_ROOM_A]: "Seminar Room A",
  [VenueType.SEMINAR_ROOM_B]: "Seminar Room B",
  [VenueType.ROOM_101]: "Room 101",
  [VenueType.ROOM_102]: "Room 102",
  [VenueType.ROOM_201]: "Room 201",
  [VenueType.ROOM_202]: "Room 202",
  [VenueType.ROOM_301]: "Room 301",
  [VenueType.ROOM_302]: "Room 302",
  [VenueType.SCIENCE_LAB_1]: "Science Lab 1",
  [VenueType.SCIENCE_LAB_2]: "Science Lab 2",
};

export const ROLE_BADGE_COLORS: Record<Role, string> = {
  [Role.ADMIN]: "bg-indigo-100 text-indigo-700",
  [Role.COLLEGE_ADMIN]: "bg-violet-100 text-violet-700",
  [Role.HOD]: "bg-sky-100 text-sky-700",
  [Role.LECTURER]: "bg-teal-100 text-teal-700",
  [Role.STUDENT]: "bg-emerald-100 text-emerald-700",
};

export const DAY_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "Monday",
  [DayOfWeek.TUESDAY]: "Tuesday",
  [DayOfWeek.WEDNESDAY]: "Wednesday",
  [DayOfWeek.THURSDAY]: "Thursday",
  [DayOfWeek.FRIDAY]: "Friday",
  [DayOfWeek.SATURDAY]: "Saturday",
  [DayOfWeek.SUNDAY]: "Sunday",
};

export const DAY_SHORT_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "MON",
  [DayOfWeek.TUESDAY]: "TUE",
  [DayOfWeek.WEDNESDAY]: "WED",
  [DayOfWeek.THURSDAY]: "THU",
  [DayOfWeek.FRIDAY]: "FRI",
  [DayOfWeek.SATURDAY]: "SAT",
  [DayOfWeek.SUNDAY]: "SUN",
};

export const DAY_MEDIUM_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "Mon",
  [DayOfWeek.TUESDAY]: "Tue",
  [DayOfWeek.WEDNESDAY]: "Wed",
  [DayOfWeek.THURSDAY]: "Thu",
  [DayOfWeek.FRIDAY]: "Fri",
  [DayOfWeek.SATURDAY]: "Sat",
  [DayOfWeek.SUNDAY]: "Sun",
};

export const WEEKDAYS = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
] as const;

export const ALL_DAYS = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
] as const;

export const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
] as const;

export const WEDNESDAY_START_TIMES = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
] as const;

export const SLOT_MAP: Record<string, string[]> = {
  "09:00": ["11:00", "12:00"],
  "10:00": ["12:00", "13:00"],
  "11:00": ["13:00", "14:00"],
  "12:00": ["14:00", "15:00"],
  "13:00": ["15:00", "16:00"],
  "14:00": ["16:00", "17:00"],
  "15:00": ["17:00", "18:00"],
  "16:00": ["18:00", "19:00"],
  "17:00": ["19:00"],
};

export const WEDNESDAY_SLOT_MAP: Record<string, string[]> = {
  "09:00": ["11:00", "12:00"],
  "10:00": ["12:00", "13:00"],
  "11:00": ["13:00", "14:00"],
  "12:00": ["14:00", "15:00"],
  "13:00": ["15:00"],
};

export const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
] as const;

export const DEPT_STYLES = [
  {
    bg: "bg-blue-50/90 hover:bg-blue-100",
    border: "border-l-blue-500",
    text: "text-blue-900",
    label: "text-blue-600",
  },
  {
    bg: "bg-indigo-50/90 hover:bg-indigo-100",
    border: "border-l-indigo-500",
    text: "text-indigo-900",
    label: "text-indigo-600",
  },
  {
    bg: "bg-rose-50/90 hover:bg-rose-100",
    border: "border-l-rose-500",
    text: "text-rose-900",
    label: "text-rose-600",
  },
  {
    bg: "bg-emerald-50/90 hover:bg-emerald-100",
    border: "border-l-emerald-500",
    text: "text-emerald-900",
    label: "text-emerald-600",
  },
  {
    bg: "bg-amber-50/90 hover:bg-amber-100",
    border: "border-l-amber-500",
    text: "text-amber-900",
    label: "text-amber-600",
  },
  {
    bg: "bg-purple-50/90 hover:bg-purple-100",
    border: "border-l-purple-500",
    text: "text-purple-900",
    label: "text-purple-600",
  },
  {
    bg: "bg-cyan-50/90 hover:bg-cyan-100",
    border: "border-l-cyan-500",
    text: "text-cyan-900",
    label: "text-cyan-600",
  },
  {
    bg: "bg-fuchsia-50/90 hover:bg-fuchsia-100",
    border: "border-l-fuchsia-500",
    text: "text-fuchsia-900",
    label: "text-fuchsia-600",
  },
] as const;

export function getDeptStyle(deptCode: string) {
  const sum = (deptCode || "")
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  return DEPT_STYLES[Math.abs(sum) % DEPT_STYLES.length] ?? DEPT_STYLES[0];
}
