import type { Schedule, Course } from "@/types";
import { DayOfWeek } from "@/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";

const DAY_OPTIONS = [
  { value: DayOfWeek.MONDAY, label: "Monday", shortLabel: "MON" },
  { value: DayOfWeek.TUESDAY, label: "Tuesday", shortLabel: "TUE" },
  { value: DayOfWeek.WEDNESDAY, label: "Wednesday", shortLabel: "WED" },
  { value: DayOfWeek.THURSDAY, label: "Thursday", shortLabel: "THU" },
  { value: DayOfWeek.FRIDAY, label: "Friday", shortLabel: "FRI" },
  { value: DayOfWeek.SATURDAY, label: "Saturday", shortLabel: "SAT" },
  { value: DayOfWeek.SUNDAY, label: "Sunday", shortLabel: "SUN" },
];

function getTimeSlots(scheds: Schedule[]): string[] {
  const timeSet = new Set<string>();
  scheds.forEach((s) => timeSet.add(`${s.startTime}-${s.endTime}`));
  return Array.from(timeSet).sort((a, b) =>
    (a.split("-")[0] ?? "").localeCompare(b.split("-")[0] ?? ""),
  );
}

function formatTimeSlot(startTime: string, endTime: string): string {
  try {
    const startHour = parseInt(startTime.split(":")[0] ?? "0");
    const endHour = parseInt(endTime.split(":")[0] ?? "0");
    const startAMPM = startHour >= 12 ? "PM" : "AM";
    const endAMPM = endHour >= 12 ? "PM" : "AM";
    const dispStart = startHour % 12 || 12;
    const dispEnd = endHour % 12 || 12;
    if (startAMPM === endAMPM) return `${dispStart}-${dispEnd} (${startAMPM})`;
    return `${dispStart}${startAMPM}-${dispEnd}${endAMPM}`;
  } catch {
    return `${startTime} - ${endTime}`;
  }
}

export function buildExportData(allSchedules: Schedule[]) {
  const timeSlots = getTimeSlots(allSchedules);
  const grid: Record<string, Record<string, { code: string }[]>> = {};
  DAY_OPTIONS.forEach((day) => {
    grid[day.value] = {};
    timeSlots.forEach((ts) => (grid[day.value]![ts] = []));
  });
  allSchedules.forEach((s) => {
    const ts = `${s.startTime}-${s.endTime}`;
    if (!grid[s.dayOfWeek]) grid[s.dayOfWeek] = {};
    if (!grid[s.dayOfWeek]![ts]) grid[s.dayOfWeek]![ts] = [];
    grid[s.dayOfWeek]![ts]!.push({ code: s.course?.code ?? "N/A" });
  });

  const courseMap = new Map<
    string,
    {
      code: string;
      title: string;
      lecturer: string;
      units: number;
      status: string;
    }
  >();
  allSchedules.forEach((s) => {
    if (!s.course || courseMap.has(s.course.code)) return;
    courseMap.set(s.course.code, {
      code: s.course.code,
      title: s.course.name,
      lecturer: s.course.lecturer?.name ?? s.course.lecturer?.email ?? "N/A",
      units: s.course.credits,
      status: "C",
    });
  });

  const courseDetails = Array.from(courseMap.values()).sort((a, b) =>
    a.code.localeCompare(b.code),
  );
  const timeHeaders = [
    "Day",
    ...timeSlots.map((ts) =>
      formatTimeSlot(ts.split("-")[0]!, ts.split("-")[1]!),
    ),
  ];
  const timetableRows = DAY_OPTIONS.map((day) => {
    const row: string[] = [day.shortLabel];
    timeSlots.forEach((ts) => {
      const scheds = grid[day.value]?.[ts] ?? [];
      row.push(scheds.length > 0 ? scheds.map((x) => x.code).join(" / ") : "");
    });
    return row;
  });

  return { timeSlots, grid, courseDetails, timeHeaders, timetableRows };
}

export async function exportAsPDF(allSchedules: Schedule[]) {
  const { courseDetails, timeHeaders, timetableRows } =
    buildExportData(allSchedules);
  const doc = new jsPDF("landscape", "mm", "a4");
  autoTable(doc, {
    head: [timeHeaders],
    body: timetableRows,
    startY: 20,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: "bold",
    },
    margin: { top: 20 },
  });
  autoTable(doc, {
    head: [
      ["S/NO.", "COURSE CODE", "COURSE TITLE", "LECTURER", "UNITS", "STATUS"],
    ],
    body: courseDetails.map((c, i) => [
      (i + 1).toString(),
      c.code,
      c.title,
      c.lecturer,
      c.units.toString(),
      c.status,
    ]),
    startY: (doc as any).lastAutoTable.finalY + 20,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: "bold",
    },
  });
  doc.save(`timetable_${new Date().toISOString().split("T")[0]}.pdf`);
}

export async function exportAsXLSX(allSchedules: Schedule[]) {
  const { courseDetails, timeHeaders, timetableRows } =
    buildExportData(allSchedules);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([timeHeaders, ...timetableRows]),
    "Timetable",
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["S/NO.", "COURSE CODE", "COURSE TITLE", "LECTURER", "UNITS", "STATUS"],
      ...courseDetails.map((c, i) => [
        i + 1,
        c.code,
        c.title,
        c.lecturer,
        c.units,
        c.status,
      ]),
    ]),
    "Course Details",
  );
  XLSX.writeFile(
    wb,
    `timetable_${new Date().toISOString().split("T")[0]}.xlsx`,
  );
}

export async function exportAsCSV(allSchedules: Schedule[]) {
  const { courseDetails, timeHeaders, timetableRows } =
    buildExportData(allSchedules);
  let csvContent = "TIMETABLE\n";
  csvContent += timeHeaders.map((h) => `"${h}"`).join(",") + "\n";
  timetableRows.forEach((row) => {
    csvContent += row.map((cell) => `"${cell}"`).join(",") + "\n";
  });
  csvContent += "\n\nCOURSE DETAILS\n";
  csvContent +=
    '"S/NO.","COURSE CODE","COURSE TITLE","LECTURER","UNITS","STATUS"\n';
  courseDetails.forEach((c, i) => {
    csvContent += `"${i + 1}","${c.code}","${c.title}","${c.lecturer}","${c.units}","${c.status}"\n`;
  });
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `timetable_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportAsPNG(allSchedules: Schedule[]) {
  const { courseDetails, timeHeaders, timetableRows } =
    buildExportData(allSchedules);
  const container = document.createElement("div");
  container.style.cssText =
    "position:absolute;left:-9999px;width:1200px;background:white;padding:20px";
  container.innerHTML = `
    <div style="font-family:Arial,sans-serif">
      <h2 style="text-align:center;margin-bottom:20px">ACADEMIC TIMETABLE</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:40px;font-size:10px">
        <thead><tr style="background:#4285F4;color:white">${timeHeaders.map((h) => `<th style="border:1px solid #000;padding:8px;text-align:center">${h}</th>`).join("")}</tr></thead>
        <tbody>${timetableRows.map((row) => `<tr>${row.map((cell, i) => `<td style="border:1px solid #000;padding:8px;text-align:center${i === 0 ? ";font-weight:bold" : ""}">${cell}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
      <h2 style="text-align:center;margin-bottom:20px">COURSE DETAILS</h2>
      <table style="width:100%;border-collapse:collapse;font-size:10px">
        <thead><tr style="background:#4285F4;color:white"><th style="border:1px solid #000;padding:8px">S/NO.</th><th style="border:1px solid #000;padding:8px">COURSE CODE</th><th style="border:1px solid #000;padding:8px">COURSE TITLE</th><th style="border:1px solid #000;padding:8px">LECTURER</th><th style="border:1px solid #000;padding:8px">UNITS</th><th style="border:1px solid #000;padding:8px">STATUS</th></tr></thead>
        <tbody>${courseDetails.map((c, i) => `<tr><td style="border:1px solid #000;padding:8px;text-align:center">${i + 1}</td><td style="border:1px solid #000;padding:8px">${c.code}</td><td style="border:1px solid #000;padding:8px">${c.title}</td><td style="border:1px solid #000;padding:8px">${c.lecturer}</td><td style="border:1px solid #000;padding:8px;text-align:center">${c.units}</td><td style="border:1px solid #000;padding:8px;text-align:center">${c.status}</td></tr>`).join("")}</tbody>
      </table>
    </div>`;
  document.body.appendChild(container);
  const canvas = await html2canvas(container, {
    scale: 2,
    backgroundColor: "#ffffff",
    logging: false,
  });
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `timetable_${new Date().toISOString().split("T")[0]}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  document.body.removeChild(container);
}
