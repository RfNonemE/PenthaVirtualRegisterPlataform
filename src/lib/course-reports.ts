type Id = string | number;

export type ReportPeriod = "course" | 1 | 2 | 3;

interface ReportCourse {
  name: string;
  level: string;
  year: number;
}

interface ReportTrimester {
  id: Id;
  number: 1 | 2 | 3;
}

interface ReportActivity {
  id: Id;
  name: string;
  maxPoints: number;
  trimesterId: Id;
}

interface ReportGrade {
  studentId: Id;
  activityId: Id;
  score: number;
  status?: "not_present";
}

interface ReportStudentInput {
  id: Id;
  name: string;
}

export interface CourseReportActivity {
  id: Id;
  trimesterNumber: 1 | 2 | 3;
  name: string;
  maxPoints: number;
  score: number | null;
  notPresent: boolean;
}

export interface CourseReportStudent {
  id: Id;
  name: string;
  activities: CourseReportActivity[];
  trimesterScores: { number: 1 | 2 | 3; score: number | null; result: "Aprobado" | "No aprobado" | "Pendiente" }[];
  finalScore: number | null;
  result: "Aprobado" | "No aprobado" | "Pendiente";
}

export interface CourseReportTrimester {
  number: 1 | 2 | 3;
  activities: { id: Id; name: string; maxPoints: number }[];
}

export interface CourseReport {
  title: "Acta de Curso" | "Acta de Trimestre";
  courseName: string;
  courseLevel: string;
  year: number;
  teacherName: string;
  periodLabel: string;
  generatedAt: string;
  period: ReportPeriod;
  trimesters: CourseReportTrimester[];
  students: CourseReportStudent[];
}

export function createCourseReport({
  course,
  teacherName,
  period,
  trimesters,
  activities,
  grades,
  students,
}: {
  course: ReportCourse;
  teacherName: string;
  period: ReportPeriod;
  trimesters: ReportTrimester[];
  activities: ReportActivity[];
  grades: ReportGrade[];
  students: ReportStudentInput[];
}): CourseReport {
  const selectedTrimesters = trimesters
    .filter(trimester => period === "course" || trimester.number === period)
    .sort((a, b) => a.number - b.number);
  const activitiesByTrimester = new Map(
    selectedTrimesters.map(trimester => [
      String(trimester.id),
      activities.filter(activity => activity.trimesterId === trimester.id),
    ]),
  );

  const reportStudents = students.map(student => {
    const trimesterScores = selectedTrimesters.map(trimester => {
      const trimesterActivities = activitiesByTrimester.get(String(trimester.id)) ?? [];
      const trimesterGrades = trimesterActivities.flatMap(activity => {
        const grade = grades.find(item => item.studentId === student.id && item.activityId === activity.id);
        return grade ? [grade] : [];
      });
      return {
        number: trimester.number,
        score: trimesterGrades.length > 0
          ? trimesterGrades.reduce((total, grade) => total + (grade.status === "not_present" ? 0 : grade.score), 0)
          : null,
        result: trimesterGrades.length === 0
          ? "Pendiente" as const
          : trimesterGrades.reduce((total, grade) => total + (grade.status === "not_present" ? 0 : grade.score), 0) >= 70
            ? "Aprobado" as const
            : "No aprobado" as const,
      };
    });
    const gradedTrimesters = trimesterScores.filter(item => item.score !== null);
    const finalScore = gradedTrimesters.length > 0
      ? gradedTrimesters.reduce((total, item) => total + (item.score ?? 0), 0) / gradedTrimesters.length
      : null;

    return {
      id: student.id,
      name: student.name,
      activities: selectedTrimesters.flatMap(trimester =>
        (activitiesByTrimester.get(String(trimester.id)) ?? []).map(activity => {
          const grade = grades.find(item => item.studentId === student.id && item.activityId === activity.id);
          return {
            id: activity.id,
            trimesterNumber: trimester.number,
            name: activity.name,
            maxPoints: activity.maxPoints,
            score: grade ? (grade.status === "not_present" ? 0 : grade.score) : null,
            notPresent: grade?.status === "not_present",
          };
        }),
      ),
      trimesterScores,
      finalScore,
      result: finalScore === null ? "Pendiente" : finalScore >= 70 ? "Aprobado" : "No aprobado",
    };
  });

  return {
    title: period === "course" ? "Acta de Curso" : "Acta de Trimestre",
    courseName: course.name,
    courseLevel: course.level,
    year: course.year,
    teacherName,
    periodLabel: period === "course"
      ? "Curso completo (trimestres 1, 2 y 3)"
      : `Trimestre ${period}`,
    generatedAt: new Intl.DateTimeFormat("es", { dateStyle: "long" }).format(new Date()),
    period,
    trimesters: selectedTrimesters.map(trimester => ({
      number: trimester.number,
      activities: (activitiesByTrimester.get(String(trimester.id)) ?? []).map(activity => ({
        id: activity.id,
        name: activity.name,
        maxPoints: activity.maxPoints,
      })),
    })),
    students: reportStudents,
  };
}

export async function downloadCourseReportPdf(report: CourseReport) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(report.title, pageWidth / 2, 18, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Curso: ${report.courseName} (${report.courseLevel})`, margin, 28);
  doc.text(`Periodo: ${report.periodLabel}`, margin, 34);
  doc.text(`Docente asignado: ${report.teacherName}`, margin, 40);
  doc.text(`Año: ${report.year}`, pageWidth - margin, 28, { align: "right" });
  doc.text(`Generado: ${report.generatedAt}`, pageWidth - margin, 34, { align: "right" });

  let cursorY = 48;
  for (const trimester of report.trimesters) {
    if (cursorY > pageHeight - 40) {
      doc.addPage();
      cursorY = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Trimestre ${trimester.number}${trimester.activities.length === 0 ? " (Sin actividades)" : ""}`, margin, cursorY);
    cursorY += 2;
    const tableHeaders = [
      "Estudiante",
      ...trimester.activities.map(activity => `${activity.name} (${activity.maxPoints} pts)`),
      "Nota trimestre",
      "Resultado trimestre",
      ...(report.period === "course" ? ["Promedio curso", "Estado curso"] : []),
    ];
    let tableFinalY = cursorY;
    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [tableHeaders],
      body: report.students.length > 0
        ? report.students.map(student => {
            const trimesterScore = student.trimesterScores.find(item => item.number === trimester.number);
            return [
              student.name,
              ...(trimester.activities.length > 0
                ? trimester.activities.map(activity => {
                    const grade = student.activities.find(item => item.id === activity.id);
                    return !grade || grade.score === null
                      ? "—"
                      : grade.notPresent ? "NP" : String(grade.score);
                  })
                : []),
              trimesterScore?.score === null || trimesterScore === undefined
                ? "Pendiente"
                : `${trimesterScore.score.toFixed(1)} / 100`,
              trimesterScore?.result ?? "Pendiente",
              ...(report.period === "course"
                ? [
                    student.finalScore === null ? "Pendiente" : `${student.finalScore.toFixed(1)} / 100`,
                    student.result,
                  ]
                : []),
            ];
          })
        : [[
            "Sin estudiantes inscritos",
            ...trimester.activities.map(() => ""),
            "",
            "",
            ...(report.period === "course" ? ["", ""] : []),
          ]],
      theme: "grid",
      styles: { font: "helvetica", fontSize: 7, cellPadding: 1.8, overflow: "linebreak" },
      headStyles: { fillColor: [34, 84, 125], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 248, 250] },
      tableWidth: pageWidth - margin * 2,
      columnStyles: {
        0: { cellWidth: 40 },
        ...Object.fromEntries(trimester.activities.map((_, index) => [
          index + 1,
          { cellWidth: Math.max(16, (pageWidth - margin * 2 - 40 - (report.period === "course" ? 104 : 50)) / Math.max(1, trimester.activities.length)) },
        ])),
        [trimester.activities.length + 1]: { cellWidth: 26 },
        [trimester.activities.length + 2]: { cellWidth: 26 },
        ...(report.period === "course"
          ? {
              [trimester.activities.length + 3]: { cellWidth: 26 },
              [trimester.activities.length + 4]: { cellWidth: 26 },
            }
          : {}),
      },
      didDrawPage: data => {
        if (data.cursor) tableFinalY = data.cursor.y;
      },
    });
    cursorY = tableFinalY + 10;
    if (cursorY > pageHeight - 28 && trimester !== report.trimesters[report.trimesters.length - 1]) {
      doc.addPage();
      cursorY = margin;
    }
  }

  if (cursorY > pageHeight - 28) {
    doc.addPage();
    cursorY = pageHeight - 22;
  } else {
    cursorY = Math.max(cursorY, pageHeight - 30);
  }
  doc.setDrawColor(60, 60, 60);
  doc.line(pageWidth / 2 - 38, cursorY, pageWidth / 2 + 38, cursorY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Firma y sello de Supervisor", pageWidth / 2, cursorY + 6, { align: "center" });

  for (let page = 1; page <= doc.getNumberOfPages(); page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(110);
    doc.text(`PENTHA - ${report.title}`, margin, pageHeight - 7);
    doc.text(`Página ${page} de ${doc.getNumberOfPages()}`, pageWidth - margin, pageHeight - 7, { align: "right" });
  }

  const safeCourseName = report.courseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const periodSuffix = report.period === "course" ? "curso-completo" : `trimestre-${report.period}`;
  doc.save(`acta-${safeCourseName}-${periodSuffix}-${report.year}.pdf`);
}
