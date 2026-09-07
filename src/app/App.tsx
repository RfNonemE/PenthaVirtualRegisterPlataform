import { useState, useMemo } from "react";
import {
  BookOpen, Users, GraduationCap, BarChart3, LogOut, Menu, X,
  Plus, Search, ChevronRight, Lock, Unlock, Edit2, Trash2,
  CheckCircle, XCircle, Clock, ChevronDown, Eye, UserPlus,
  Award, TrendingUp, AlertCircle, Home, Shield
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type Role = "admin" | "teacher";

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

interface Teacher {
  id: number;
  name: string;
  email: string;
  courses: number[];
}

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  enrolledCourses: number[];
}

interface Activity {
  id: number;
  name: string;
  percentage: number;
  trimesterId: number;
}

interface Grade {
  id: number;
  studentId: number;
  activityId: number;
  score: number;
  observation: string;
}

interface Trimester {
  id: number;
  number: 1 | 2 | 3;
  courseId: number;
  startDate: string;
  endDate: string;
  status: "open" | "closed";
}

interface Course {
  id: number;
  name: string;
  level: string;
  teacherId: number | null;
  year: number;
  description: string;
}

type View =
  | "dashboard"
  | "courses"
  | "course-detail"
  | "students"
  | "users"
  | "grades";

// ── Seed Data ──────────────────────────────────────────────────────────────

const SEED_TEACHERS: Teacher[] = [
  { id: 1, name: "Andrea Solano", email: "asolano@academy.com", courses: [1, 2] },
  { id: 2, name: "Carlos Méndez", email: "cmendez@academy.com", courses: [3] },
  { id: 3, name: "Patricia Vega", email: "pvega@academy.com", courses: [4] },
];

const SEED_STUDENTS: Student[] = [
  { id: 1, name: "Lucía Herrera", email: "lherrera@mail.com", phone: "8888-1234", enrolledCourses: [1, 3] },
  { id: 2, name: "Marco Jiménez", email: "mjimenez@mail.com", phone: "8888-5678", enrolledCourses: [1] },
  { id: 3, name: "Valentina Castro", email: "vcastro@mail.com", phone: "8888-9012", enrolledCourses: [2, 4] },
  { id: 4, name: "Diego Mora", email: "dmora@mail.com", phone: "8888-3456", enrolledCourses: [1, 2] },
  { id: 5, name: "Isabella Quirós", email: "iquiros@mail.com", phone: "8888-7890", enrolledCourses: [3] },
  { id: 6, name: "Sebastián Ulate", email: "sulate@mail.com", phone: "8888-2345", enrolledCourses: [4] },
];

const SEED_COURSES: Course[] = [
  { id: 1, name: "Principiantes", level: "A1", teacherId: 1, year: 2025, description: "Curso introductorio para estudiantes sin conocimiento previo de inglés." },
  { id: 2, name: "Básico", level: "A2", teacherId: 1, year: 2025, description: "Consolidación de bases gramaticales y vocabulario fundamental." },
  { id: 3, name: "Pre-Intermedio", level: "B1", teacherId: 2, year: 2025, description: "Desarrollo de habilidades comunicativas en situaciones cotidianas." },
  { id: 4, name: "Intermedio", level: "B2", teacherId: 3, year: 2025, description: "Fluencia conversacional y comprensión de textos complejos." },
];

const SEED_TRIMESTERS: Trimester[] = [
  { id: 1, number: 1, courseId: 1, startDate: "2025-01-15", endDate: "2025-04-15", status: "closed" },
  { id: 2, number: 2, courseId: 1, startDate: "2025-04-28", endDate: "2025-08-01", status: "open" },
  { id: 3, number: 3, courseId: 1, startDate: "2025-08-18", endDate: "2025-11-28", status: "open" },
  { id: 4, number: 1, courseId: 2, startDate: "2025-01-15", endDate: "2025-04-15", status: "closed" },
  { id: 5, number: 2, courseId: 2, startDate: "2025-04-28", endDate: "2025-08-01", status: "open" },
  { id: 6, number: 3, courseId: 2, startDate: "2025-08-18", endDate: "2025-11-28", status: "open" },
  { id: 7, number: 1, courseId: 3, startDate: "2025-01-15", endDate: "2025-04-15", status: "closed" },
  { id: 8, number: 2, courseId: 3, startDate: "2025-04-28", endDate: "2025-08-01", status: "open" },
  { id: 9, number: 3, courseId: 3, startDate: "2025-08-18", endDate: "2025-11-28", status: "open" },
  { id: 10, number: 1, courseId: 4, startDate: "2025-01-15", endDate: "2025-04-15", status: "closed" },
  { id: 11, number: 2, courseId: 4, startDate: "2025-04-28", endDate: "2025-08-01", status: "open" },
  { id: 12, number: 3, courseId: 4, startDate: "2025-08-18", endDate: "2025-11-28", status: "open" },
];

const SEED_ACTIVITIES: Activity[] = [
  { id: 1, name: "Examen Parcial", percentage: 30, trimesterId: 1 },
  { id: 2, name: "Trabajo Oral", percentage: 20, trimesterId: 1 },
  { id: 3, name: "Composición Escrita", percentage: 20, trimesterId: 1 },
  { id: 4, name: "Examen Final", percentage: 30, trimesterId: 1 },
  { id: 5, name: "Quiz Vocabulario", percentage: 20, trimesterId: 2 },
  { id: 6, name: "Proyecto Grupal", percentage: 30, trimesterId: 2 },
  { id: 7, name: "Examen Parcial", percentage: 25, trimesterId: 2 },
  { id: 8, name: "Examen Final", percentage: 25, trimesterId: 2 },
  { id: 9, name: "Examen Parcial", percentage: 30, trimesterId: 4 },
  { id: 10, name: "Presentación Oral", percentage: 25, trimesterId: 4 },
  { id: 11, name: "Examen Final", percentage: 45, trimesterId: 4 },
];

const SEED_GRADES: Grade[] = [
  { id: 1, studentId: 1, activityId: 1, score: 85, observation: "Buen manejo gramatical" },
  { id: 2, studentId: 1, activityId: 2, score: 90, observation: "Excelente pronunciación" },
  { id: 3, studentId: 1, activityId: 3, score: 78, observation: "" },
  { id: 4, studentId: 1, activityId: 4, score: 88, observation: "" },
  { id: 5, studentId: 2, activityId: 1, score: 72, observation: "Necesita reforzar gramática" },
  { id: 6, studentId: 2, activityId: 2, score: 65, observation: "" },
  { id: 7, studentId: 2, activityId: 3, score: 80, observation: "" },
  { id: 8, studentId: 2, activityId: 4, score: 70, observation: "" },
  { id: 9, studentId: 4, activityId: 1, score: 95, observation: "Desempeño sobresaliente" },
  { id: 10, studentId: 4, activityId: 2, score: 92, observation: "" },
  { id: 11, studentId: 4, activityId: 3, score: 88, observation: "" },
  { id: 12, studentId: 4, activityId: 4, score: 97, observation: "" },
];

// ── Auth Screen ────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState("admin@academy.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");

  const DEMO_USERS: User[] = [
    { id: 1, name: "Ana García", email: "admin@academy.com", role: "admin", avatar: "AG" },
    { id: 2, name: "Andrea Solano", email: "asolano@academy.com", role: "teacher", avatar: "AS" },
    { id: 3, name: "Carlos Méndez", email: "cmendez@academy.com", role: "teacher", avatar: "CM" },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = DEMO_USERS.find(u => u.email === email);
    if (user && password === "password") {
      onLogin(user);
    } else {
      setError("Credenciales incorrectas. Use password: password");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">PENTHA</h1>
          <p className="text-muted-foreground text-sm mt-1">Virtual Register Platform</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-8">
          <h2 className="text-base font-medium text-foreground mb-6">Iniciar Sesión</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder="usuario@academy.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors mt-2"
            >
              Ingresar
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">Cuentas de demostración:</p>
            <div className="space-y-2">
              {[
                { email: "admin@academy.com", label: "Administrador", icon: Shield },
                { email: "asolano@academy.com", label: "Docente — Principiantes, Básico", icon: GraduationCap },
                { email: "cmendez@academy.com", label: "Docente — Pre-Intermedio", icon: GraduationCap },
              ].map(acc => (
                <button
                  key={acc.email}
                  onClick={() => { setEmail(acc.email); setPassword("password"); setError(""); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-secondary transition-colors group"
                >
                  <acc.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">{acc.label}</p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{acc.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard", label: "Panel Principal", icon: Home, roles: ["admin", "teacher"] as Role[] },
  { id: "courses", label: "Cursos", icon: BookOpen, roles: ["admin", "teacher"] as Role[] },
  { id: "students", label: "Estudiantes", icon: GraduationCap, roles: ["admin", "teacher"] as Role[] },
  { id: "grades", label: "Calificaciones", icon: BarChart3, roles: ["admin", "teacher"] as Role[] },
  { id: "users", label: "Usuarios", icon: Users, roles: ["admin"] as Role[] },
];

function Sidebar({
  user, view, onNavigate, collapsed, onToggle
}: {
  user: User;
  view: View;
  onNavigate: (v: View) => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside className={`flex flex-col border-r border-border bg-card transition-all duration-200 ${collapsed ? "w-16" : "w-60"} min-h-screen flex-shrink-0`}>
      {/* Header */}
      <div className="flex items-center h-14 px-4 border-b border-border gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-primary" />
        </div>
        {!collapsed && <span className="text-sm font-semibold text-foreground truncate">PENTHA</span>}
        <button onClick={onToggle} className="ml-auto text-muted-foreground hover:text-foreground transition-colors p-1 rounded">
          {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {NAV_ITEMS.filter(n => n.roles.includes(user.role)).map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as View)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              view === item.id || (item.id === "courses" && view === "course-detail")
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">
            {user.avatar}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role === "admin" ? "Administrador" : "Docente"}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────

function Dashboard({ user, courses, students, teachers, trimesters, onNavigate }: {
  user: User;
  courses: Course[];
  students: Student[];
  teachers: Teacher[];
  trimesters: Trimester[];
  onNavigate: (v: View) => void;
}) {
  const visibleCourses = user.role === "admin"
    ? courses
    : courses.filter(c => {
        const t = teachers.find(t => t.email === user.email);
        return t ? t.courses.includes(c.id) : false;
      });

  const openTrimesters = trimesters.filter(t => t.status === "open" && visibleCourses.some(c => c.id === t.courseId));
  const closedTrimesters = trimesters.filter(t => t.status === "closed" && visibleCourses.some(c => c.id === t.courseId));

  const stats = user.role === "admin"
    ? [
        { label: "Cursos Activos", value: courses.length, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
        { label: "Docentes", value: teachers.length, icon: Users, color: "text-orange-500", bg: "bg-orange-100" },
        { label: "Estudiantes", value: students.length, icon: GraduationCap, color: "text-orange-700", bg: "bg-orange-50" },
        { label: "Trimestres Abiertos", value: openTrimesters.length, icon: Clock, color: "text-green-600", bg: "bg-green-100" },
      ]
    : [
        { label: "Mis Cursos", value: visibleCourses.length, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
        { label: "Trimestres Abiertos", value: openTrimesters.length, icon: Clock, color: "text-green-600", bg: "bg-green-100" },
        { label: "Trimestres Cerrados", value: closedTrimesters.length, icon: Lock, color: "text-muted-foreground", bg: "bg-muted/30" },
      ];

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Panel Principal</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Bienvenido, {user.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5">
            <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-3`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-semibold text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Courses grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-foreground">{user.role === "admin" ? "Todos los Cursos" : "Mis Cursos"}</h2>
          <button onClick={() => onNavigate("courses")} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
            Ver todos <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleCourses.map(course => {
            const teacher = teachers.find(t => t.id === course.teacherId);
            const courseTrimesters = trimesters.filter(t => t.courseId === course.id);
            const enrolled = students.filter(s => s.enrolledCourses.includes(course.id));
            return (
              <div key={course.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-medium text-primary px-2 py-0.5 bg-primary/10 rounded-md" style={{ fontFamily: "JetBrains Mono, monospace" }}>{course.level}</span>
                    <h3 className="text-sm font-semibold text-foreground mt-2">{course.name}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">{course.year}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{course.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {enrolled.length} estudiantes</span>
                    {teacher && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {teacher.name.split(" ")[0]}</span>}
                  </div>
                  <div className="flex gap-1">
                    {courseTrimesters.map(t => (
                      <span key={t.id} className={`w-2 h-2 rounded-full ${t.status === "open" ? "bg-green-500" : "bg-muted-foreground/40"}`} title={`T${t.number}: ${t.status}`} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Courses View ───────────────────────────────────────────────────────────

function CoursesView({ user, courses, setCourses, teachers, students, trimesters, setTrimesters, onSelectCourse }: {
  user: User;
  courses: Course[];
  setCourses: (c: Course[]) => void;
  teachers: Teacher[];
  students: Student[];
  trimesters: Trimester[];
  setTrimesters: (t: Trimester[]) => void;
  onSelectCourse: (id: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterTeacher, setFilterTeacher] = useState<number | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: "", level: "", teacherId: "", description: "" });

  const myTeacher = teachers.find(t => t.email === user.email);
  const visible = courses.filter(c => {
    if (user.role === "teacher" && myTeacher) return myTeacher.courses.includes(c.id);
    return true;
  }).filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchTeacher = filterTeacher === "all" || c.teacherId === filterTeacher;
    return matchSearch && matchTeacher;
  });

  function addCourse() {
    if (!newCourse.name || !newCourse.level) return;
    const id = Math.max(...courses.map(c => c.id)) + 1;
    const course: Course = {
      id, name: newCourse.name, level: newCourse.level,
      teacherId: newCourse.teacherId ? Number(newCourse.teacherId) : null,
      year: 2025, description: newCourse.description,
    };
    setCourses([...courses, course]);
    const newTrims: Trimester[] = [1, 2, 3].map((n, i) => ({
      id: Math.max(...trimesters.map(t => t.id)) + 1 + i,
      number: n as 1 | 2 | 3,
      courseId: id,
      startDate: ["2025-01-15", "2025-04-28", "2025-08-18"][n - 1],
      endDate: ["2025-04-15", "2025-08-01", "2025-11-28"][n - 1],
      status: "open",
    }));
    setTrimesters([...trimesters, ...newTrims]);
    setNewCourse({ name: "", level: "", teacherId: "", description: "" });
    setShowForm(false);
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Cursos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{visible.length} curso{visible.length !== 1 ? "s" : ""} registrado{visible.length !== 1 ? "s" : ""}</p>
        </div>
        {user.role === "admin" && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Nuevo Curso
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar curso..."
            className="w-full bg-input-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 transition-all"
          />
        </div>
        {user.role === "admin" && (
          <select
            value={filterTeacher}
            onChange={e => setFilterTeacher(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
          >
            <option value="all">Todos los docentes</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
      </div>

      {/* New course form */}
      {showForm && user.role === "admin" && (
        <div className="bg-card border border-primary/20 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Registrar Nuevo Curso</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">Nombre del Curso</label>
              <input value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50" placeholder="Ej. Principiantes" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">Nivel</label>
              <select value={newCourse.level} onChange={e => setNewCourse({ ...newCourse, level: e.target.value })}
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50">
                <option value="">Seleccionar nivel</option>
                {["A1", "A2", "B1", "B2", "C1", "C2"].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">Docente</label>
              <select value={newCourse.teacherId} onChange={e => setNewCourse({ ...newCourse, teacherId: e.target.value })}
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50">
                <option value="">Sin asignar</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">Descripción</label>
              <input value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50" placeholder="Descripción del curso" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={addCourse} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">Guardar</button>
            <button onClick={() => setShowForm(false)} className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2 text-sm hover:bg-secondary/80 transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      {/* Course table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Curso</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nivel</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Docente</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estudiantes</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Trimestres</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((course, i) => {
              const teacher = teachers.find(t => t.id === course.teacherId);
              const enrolled = students.filter(s => s.enrolledCourses.includes(course.id));
              const courseTrimesters = trimesters.filter(t => t.courseId === course.id);
              return (
                <tr key={course.id} className={`border-b border-border last:border-0 hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? "" : "bg-secondary/10"}`}>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-foreground">{course.name}</p>
                    <p className="text-xs text-muted-foreground">{course.year}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-medium text-primary px-2 py-0.5 bg-primary/10 rounded" style={{ fontFamily: "JetBrains Mono, monospace" }}>{course.level}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-foreground">{teacher?.name ?? <span className="text-muted-foreground italic">Sin asignar</span>}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{enrolled.length}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1.5">
                      {courseTrimesters.map(t => (
                        <div key={t.id} className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${t.status === "open" ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                          <span className="text-xs text-muted-foreground">T{t.number}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => onSelectCourse(course.id)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 ml-auto transition-colors">
                      <Eye className="w-3.5 h-3.5" /> Ver
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Course Detail ──────────────────────────────────────────────────────────

function CourseDetail({ user, course, teachers, students, setStudents, trimesters, setTrimesters, activities, setActivities, grades, setGrades, onBack }: {
  user: User;
  course: Course;
  teachers: Teacher[];
  students: Student[];
  setStudents: (s: Student[]) => void;
  trimesters: Trimester[];
  setTrimesters: (t: Trimester[]) => void;
  activities: Activity[];
  setActivities: (a: Activity[]) => void;
  grades: Grade[];
  setGrades: (g: Grade[]) => void;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | 1 | 2 | 3>("overview");
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState<number | null>(null);
  const [newActivity, setNewActivity] = useState({ name: "", percentage: "" });
  const [editingGrade, setEditingGrade] = useState<{ studentId: number; activityId: number } | null>(null);
  const [gradeVal, setGradeVal] = useState("");
  const [gradeObs, setGradeObs] = useState("");

  const teacher = teachers.find(t => t.id === course.teacherId);
  const enrolled = students.filter(s => s.enrolledCourses.includes(course.id));
  const notEnrolled = students.filter(s => !s.enrolledCourses.includes(course.id));
  const courseTrimesters = trimesters.filter(t => t.courseId === course.id).sort((a, b) => a.number - b.number);

  function enroll(studentId: number) {
    setStudents(students.map(s => s.id === studentId ? { ...s, enrolledCourses: [...s.enrolledCourses, course.id] } : s));
  }

  function toggleTrimester(trimId: number) {
    setTrimesters(trimesters.map(t => t.id === trimId ? { ...t, status: t.status === "open" ? "closed" : "open" } : t));
  }

  function addActivity(trimesterId: number) {
    if (!newActivity.name || !newActivity.percentage) return;
    const trimActivities = activities.filter(a => a.trimesterId === trimesterId);
    const usedPct = trimActivities.reduce((sum, a) => sum + a.percentage, 0);
    if (usedPct + Number(newActivity.percentage) > 100) {
      alert("El porcentaje total no puede superar el 100%");
      return;
    }
    const id = Math.max(0, ...activities.map(a => a.id)) + 1;
    setActivities([...activities, { id, name: newActivity.name, percentage: Number(newActivity.percentage), trimesterId }]);
    setNewActivity({ name: "", percentage: "" });
    setShowActivityForm(null);
  }

  function saveGrade() {
    if (!editingGrade) return;
    const score = Number(gradeVal);
    if (score < 0 || score > 100) return;
    const exists = grades.find(g => g.studentId === editingGrade.studentId && g.activityId === editingGrade.activityId);
    if (exists) {
      setGrades(grades.map(g => g.id === exists.id ? { ...g, score, observation: gradeObs } : g));
    } else {
      const id = Math.max(0, ...grades.map(g => g.id)) + 1;
      setGrades([...grades, { id, studentId: editingGrade.studentId, activityId: editingGrade.activityId, score, observation: gradeObs }]);
    }
    setEditingGrade(null);
    setGradeVal("");
    setGradeObs("");
  }

  function calcStudentTrimGrade(studentId: number, trimesterId: number) {
    const trimActivities = activities.filter(a => a.trimesterId === trimesterId);
    if (trimActivities.length === 0) return null;
    let total = 0;
    let totalPct = 0;
    for (const act of trimActivities) {
      const grade = grades.find(g => g.studentId === studentId && g.activityId === act.id);
      if (grade) { total += (grade.score * act.percentage) / 100; totalPct += act.percentage; }
    }
    if (totalPct === 0) return null;
    return (total / totalPct) * 100;
  }

  const activeTrimester = typeof activeTab === "number" ? courseTrimesters.find(t => t.number === activeTab) : null;
  const trimActivities = activeTrimester ? activities.filter(a => a.trimesterId === activeTrimester.id) : [];
  const usedPct = trimActivities.reduce((sum, a) => sum + a.percentage, 0);
  const isOpen = activeTrimester?.status === "open";
  const canEdit = user.role === "admin" || (user.role === "teacher" && isOpen);

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4 transition-colors">
          <ChevronRight className="w-3 h-3 rotate-180" /> Volver a Cursos
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-medium text-primary px-2 py-0.5 bg-primary/10 rounded" style={{ fontFamily: "JetBrains Mono, monospace" }}>{course.level}</span>
              <h1 className="text-xl font-semibold text-foreground">{course.name}</h1>
            </div>
            <p className="text-sm text-muted-foreground">{course.description}</p>
          </div>
          {teacher && (
            <div className="text-right text-sm">
              <p className="text-muted-foreground text-xs">Docente</p>
              <p className="text-foreground font-medium">{teacher.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/30 rounded-xl p-1 w-fit">
        {(["overview", 1, 2, 3] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab === "overview" ? "Resumen" : `Trimestre ${tab}`}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-3 gap-6">
          {/* Enrolled students */}
          <div className="col-span-2 bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Estudiantes Inscritos ({enrolled.length})</h2>
              {user.role === "admin" && notEnrolled.length > 0 && (
                <button onClick={() => setShowEnrollForm(!showEnrollForm)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                  <UserPlus className="w-3.5 h-3.5" /> Inscribir
                </button>
              )}
            </div>
            {showEnrollForm && (
              <div className="mb-4 p-3 bg-secondary/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Seleccionar estudiante a inscribir:</p>
                <div className="space-y-1">
                  {notEnrolled.map(s => (
                    <button key={s.id} onClick={() => { enroll(s.id); setShowEnrollForm(false); }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-secondary text-sm text-left transition-colors">
                      <span className="text-foreground">{s.name}</span>
                      <span className="text-xs text-primary">+ Inscribir</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              {enrolled.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 text-xs font-medium flex items-center justify-center">
                      {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm text-foreground font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    {courseTrimesters.map(t => {
                      const g = calcStudentTrimGrade(s.id, t.id);
                      return (
                        <span key={t.id} className={`px-2 py-0.5 rounded ${g !== null ? (g >= 70 ? "bg-green-100 text-green-700" : "bg-red-400/10 text-red-400") : "bg-muted/30 text-muted-foreground"}`}>
                          T{t.number}: {g !== null ? g.toFixed(1) : "—"}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
              {enrolled.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No hay estudiantes inscritos</p>}
            </div>
          </div>

          {/* Trimester status */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Estado de Trimestres</h2>
            <div className="space-y-3">
              {courseTrimesters.map(t => (
                <div key={t.id} className={`p-3 rounded-lg border ${t.status === "open" ? "border-green-200 bg-green-50" : "border-border bg-muted/10"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Trimestre {t.number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.status === "open" ? "bg-green-100 text-green-700" : "bg-muted/30 text-muted-foreground"}`}>
                      {t.status === "open" ? "Abierto" : "Cerrado"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2" style={{ fontFamily: "JetBrains Mono, monospace" }}>{t.startDate} → {t.endDate}</p>
                  {user.role === "admin" && (
                    <button
                      onClick={() => toggleTrimester(t.id)}
                      className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium transition-colors ${t.status === "open" ? "bg-orange-100 text-orange-600 hover:bg-orange-200" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
                    >
                      {t.status === "open" ? <><Lock className="w-3 h-3" /> Cerrar</> : <><Unlock className="w-3 h-3" /> Reabrir</>}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trimester tabs */}
      {typeof activeTab === "number" && activeTrimester && (
        <div className="space-y-5">
          {/* Status bar */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${activeTrimester.status === "open" ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
            <div className="flex items-center gap-3">
              {activeTrimester.status === "open" ? <Unlock className="w-4 h-4 text-green-600" /> : <Lock className="w-4 h-4 text-orange-500" />}
              <div>
                <p className="text-sm font-medium text-foreground">Trimestre {activeTrimester.number} — {activeTrimester.status === "open" ? "Abierto" : "Cerrado"}</p>
                <p className="text-xs text-muted-foreground">{activeTrimester.startDate} → {activeTrimester.endDate}</p>
              </div>
            </div>
            {user.role === "admin" && (
              <button
                onClick={() => toggleTrimester(activeTrimester.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTrimester.status === "open" ? "bg-orange-100 text-orange-600 hover:bg-orange-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
              >
                {activeTrimester.status === "open" ? <><Lock className="w-3 h-3" /> Cerrar Trimestre</> : <><Unlock className="w-3 h-3" /> Reabrir Trimestre</>}
              </button>
            )}
          </div>

          {/* Activities */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Actividades Evaluativas</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Porcentaje utilizado: <span style={{ fontFamily: "JetBrains Mono, monospace" }} className={usedPct > 100 ? "text-red-400" : usedPct === 100 ? "text-green-600" : "text-orange-500"}>{usedPct}%</span> / 100%
                </p>
              </div>
              {canEdit && usedPct < 100 && (
                <button onClick={() => setShowActivityForm(activeTrimester.id)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Agregar Actividad
                </button>
              )}
            </div>

            {showActivityForm === activeTrimester.id && (
              <div className="mb-4 p-3 bg-secondary/30 rounded-lg flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">Nombre</label>
                  <input value={newActivity.name} onChange={e => setNewActivity({ ...newActivity, name: e.target.value })}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary/50" placeholder="Ej. Examen Parcial" />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-muted-foreground mb-1">Porcentaje</label>
                  <input value={newActivity.percentage} onChange={e => setNewActivity({ ...newActivity, percentage: e.target.value })}
                    type="number" min="1" max={100 - usedPct}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary/50" placeholder={`Máx ${100 - usedPct}`} />
                </div>
                <button onClick={() => addActivity(activeTrimester.id)} className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-medium">Agregar</button>
                <button onClick={() => setShowActivityForm(null)} className="text-muted-foreground hover:text-foreground text-xs px-2">✕</button>
              </div>
            )}

            {trimActivities.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-4">No hay actividades registradas</p>
              : (
                <div className="space-y-2">
                  {trimActivities.map(act => (
                    <div key={act.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                      <span className="text-sm text-foreground">{act.name}</span>
                      <span className="text-xs font-medium text-primary px-2 py-0.5 bg-primary/10 rounded" style={{ fontFamily: "JetBrains Mono, monospace" }}>{act.percentage}%</span>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Grades table */}
          {trimActivities.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Calificaciones</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/20">
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-40">Estudiante</th>
                      {trimActivities.map(act => (
                        <th key={act.id} className="text-center px-3 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          <div>{act.name}</div>
                          <div className="text-primary/70 normal-case" style={{ fontFamily: "JetBrains Mono, monospace" }}>{act.percentage}%</div>
                        </th>
                      ))}
                      <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nota Final</th>
                      <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolled.map(student => {
                      const finalGrade = calcStudentTrimGrade(student.id, activeTrimester.id);
                      const passed = finalGrade !== null && finalGrade >= 70;
                      return (
                        <tr key={student.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/20 transition-colors">
                          <td className="px-5 py-3 text-sm text-foreground font-medium">{student.name}</td>
                          {trimActivities.map(act => {
                            const grade = grades.find(g => g.studentId === student.id && g.activityId === act.id);
                            const isEditing = editingGrade?.studentId === student.id && editingGrade?.activityId === act.id;
                            return (
                              <td key={act.id} className="px-3 py-3 text-center">
                                {isEditing ? (
                                  <div className="flex flex-col gap-1 items-center">
                                    <input value={gradeVal} onChange={e => setGradeVal(e.target.value)}
                                      type="number" min="0" max="100" autoFocus
                                      className="w-16 bg-input-background border border-primary/50 rounded px-2 py-0.5 text-xs text-center text-foreground outline-none"
                                      onKeyDown={e => { if (e.key === "Enter") saveGrade(); if (e.key === "Escape") setEditingGrade(null); }}
                                    />
                                    <input value={gradeObs} onChange={e => setGradeObs(e.target.value)}
                                      className="w-24 bg-input-background border border-border rounded px-2 py-0.5 text-xs text-foreground outline-none"
                                      placeholder="Observación"
                                    />
                                    <div className="flex gap-1">
                                      <button onClick={saveGrade} className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">✓</button>
                                      <button onClick={() => setEditingGrade(null)} className="text-xs text-muted-foreground px-1">✕</button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    disabled={!canEdit}
                                    onClick={() => {
                                      setEditingGrade({ studentId: student.id, activityId: act.id });
                                      setGradeVal(grade ? String(grade.score) : "");
                                      setGradeObs(grade?.observation ?? "");
                                    }}
                                    className={`text-sm font-medium transition-colors rounded px-2 py-0.5 ${
                                      grade
                                        ? grade.score >= 70
                                          ? "text-green-600 hover:bg-green-500/10"
                                          : "text-red-400 hover:bg-red-400/10"
                                        : "text-muted-foreground/40 hover:text-muted-foreground"
                                    } ${!canEdit ? "cursor-default" : "cursor-pointer"}`}
                                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                                    title={grade?.observation || ""}
                                  >
                                    {grade ? grade.score : "—"}
                                    {grade?.observation && <span className="ml-1 text-xs text-muted-foreground/60">*</span>}
                                  </button>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-center">
                            <span className={`text-sm font-semibold ${finalGrade !== null ? (passed ? "text-green-600" : "text-red-400") : "text-muted-foreground/40"}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>
                              {finalGrade !== null ? finalGrade.toFixed(1) : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {finalGrade !== null ? (
                              passed
                                ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" /> Aprobado</span>
                                : <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Reprobado</span>
                            ) : (
                              <span className="text-xs text-muted-foreground/40">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!isOpen && (
                <div className="px-5 py-2.5 bg-orange-50 border-t border-orange-200">
                  <p className="text-xs text-orange-500 flex items-center gap-1.5"><Lock className="w-3 h-3" /> Trimestre cerrado — las calificaciones son de solo lectura</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Students View ──────────────────────────────────────────────────────────

function StudentsView({ user, students, setStudents, courses, teachers }: {
  user: User;
  students: Student[];
  setStudents: (s: Student[]) => void;
  courses: Course[];
  teachers: Teacher[];
}) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", email: "", phone: "" });

  const myTeacher = teachers.find(t => t.email === user.email);
  const myCourseIds = myTeacher?.courses ?? [];

  const visible = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    if (user.role === "teacher") {
      const inMyCourse = s.enrolledCourses.some(id => myCourseIds.includes(id));
      return matchSearch && inMyCourse;
    }
    return matchSearch;
  });

  function addStudent() {
    if (!newStudent.name || !newStudent.email) return;
    const id = Math.max(...students.map(s => s.id)) + 1;
    setStudents([...students, { id, name: newStudent.name, email: newStudent.email, phone: newStudent.phone, enrolledCourses: [] }]);
    setNewStudent({ name: "", email: "", phone: "" });
    setShowForm(false);
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Estudiantes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{visible.length} estudiante{visible.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Nuevo Estudiante
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className="w-full max-w-sm bg-input-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 transition-all"
        />
      </div>

      {showForm && (
        <div className="bg-card border border-primary/20 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Registrar Estudiante</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: "name", label: "Nombre Completo", placeholder: "Ej. María Rodríguez" },
              { key: "email", label: "Correo Electrónico", placeholder: "maria@correo.com" },
              { key: "phone", label: "Teléfono", placeholder: "8888-0000" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">{f.label}</label>
                <input
                  value={(newStudent as any)[f.key]}
                  onChange={e => setNewStudent({ ...newStudent, [f.key]: e.target.value })}
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
                  placeholder={f.placeholder}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={addStudent} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">Guardar</button>
            <button onClick={() => setShowForm(false)} className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2 text-sm hover:bg-secondary/80 transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estudiante</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Contacto</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cursos Inscritos</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s, i) => {
              const enrolledNames = s.enrolledCourses.map(id => courses.find(c => c.id === id)?.name).filter(Boolean);
              return (
                <tr key={s.id} className={`border-b border-border last:border-0 hover:bg-secondary/20 transition-colors ${i % 2 === 0 ? "" : "bg-secondary/10"}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-xs font-medium flex items-center justify-center flex-shrink-0">
                        {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{s.phone || "—"}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {enrolledNames.length > 0
                        ? enrolledNames.map((n, idx) => (
                          <span key={idx} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">{n}</span>
                        ))
                        : <span className="text-xs text-muted-foreground italic">Sin cursos</span>
                      }
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Users View ─────────────────────────────────────────────────────────────

function UsersView({ teachers, setTeachers, courses }: {
  teachers: Teacher[];
  setTeachers: (t: Teacher[]) => void;
  courses: Course[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: "", email: "" });

  const ADMINS = [{ id: 1, name: "Ana García", email: "admin@academy.com", role: "admin" }];

  function addTeacher() {
    if (!newTeacher.name || !newTeacher.email) return;
    const id = Math.max(...teachers.map(t => t.id)) + 1;
    setTeachers([...teachers, { id, name: newTeacher.name, email: newTeacher.email, courses: [] }]);
    setNewTeacher({ name: "", email: "" });
    setShowForm(false);
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Usuarios</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestión de administradores y docentes</p>
      </div>

      {/* Admins */}
      <section>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" /> Administradores
        </h2>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {ADMINS.map((a, i) => (
            <div key={a.id} className="flex items-center justify-between px-5 py-3.5 border-b border-border/40 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                  {a.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.email}</p>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">Administrador</span>
            </div>
          ))}
        </div>
      </section>

      {/* Teachers */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5" /> Docentes ({teachers.length})
          </h2>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Agregar Docente
          </button>
        </div>

        {showForm && (
          <div className="mb-4 bg-card border border-primary/20 rounded-xl p-5 flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">Nombre</label>
              <input value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })}
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50" placeholder="Nombre completo" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">Correo</label>
              <input value={newTeacher.email} onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })}
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50" placeholder="docente@academy.com" />
            </div>
            <button onClick={addTeacher} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium flex-shrink-0">Guardar</button>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground text-sm flex-shrink-0">✕</button>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Docente</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cursos Asignados</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t, i) => {
                const teacherCourses = courses.filter(c => t.courses.includes(c.id));
                return (
                  <tr key={t.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-secondary/10"}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold flex items-center justify-center">
                          {t.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {teacherCourses.length > 0
                          ? teacherCourses.map(c => (
                            <span key={c.id} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{c.name}</span>
                          ))
                          : <span className="text-xs text-muted-foreground italic">Sin cursos asignados</span>
                        }
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ── Grades Overview ────────────────────────────────────────────────────────

function GradesView({ user, courses, students, teachers, trimesters, activities, grades }: {
  user: User;
  courses: Course[];
  students: Student[];
  teachers: Teacher[];
  trimesters: Trimester[];
  activities: Activity[];
  grades: Grade[];
}) {
  const [selectedCourse, setSelectedCourse] = useState<number | "all">("all");

  const myTeacher = teachers.find(t => t.email === user.email);
  const visibleCourses = user.role === "admin" ? courses : courses.filter(c => myTeacher?.courses.includes(c.id));

  function calcStudentTrimGrade(studentId: number, trimesterId: number) {
    const trimActivities = activities.filter(a => a.trimesterId === trimesterId);
    if (trimActivities.length === 0) return null;
    let total = 0; let totalPct = 0;
    for (const act of trimActivities) {
      const g = grades.find(g => g.studentId === studentId && g.activityId === act.id);
      if (g) { total += (g.score * act.percentage) / 100; totalPct += act.percentage; }
    }
    return totalPct === 0 ? null : (total / totalPct) * 100;
  }

  const filteredCourses = selectedCourse === "all" ? visibleCourses : visibleCourses.filter(c => c.id === selectedCourse);

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Calificaciones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Resumen de notas por curso y trimestre</p>
        </div>
        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50">
          <option value="all">Todos los cursos</option>
          {visibleCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="space-y-6">
        {filteredCourses.map(course => {
          const enrolled = students.filter(s => s.enrolledCourses.includes(course.id));
          const courseTrimesters = trimesters.filter(t => t.courseId === course.id).sort((a, b) => a.number - b.number);
          const teacher = teachers.find(t => t.id === course.teacherId);
          return (
            <div key={course.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-primary font-medium px-2 py-0.5 bg-primary/10 rounded" style={{ fontFamily: "JetBrains Mono, monospace" }}>{course.level}</span>
                  <h3 className="text-sm font-semibold text-foreground">{course.name}</h3>
                  {teacher && <span className="text-xs text-muted-foreground">— {teacher.name}</span>}
                </div>
                <span className="text-xs text-muted-foreground">{enrolled.length} estudiantes</span>
              </div>
              {enrolled.length === 0
                ? <p className="text-sm text-muted-foreground px-5 py-4">Sin estudiantes inscritos</p>
                : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-secondary/10">
                        <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estudiante</th>
                        {courseTrimesters.map(t => (
                          <th key={t.id} className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            T{t.number}
                            <span className={`ml-1.5 inline-block w-1.5 h-1.5 rounded-full ${t.status === "open" ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                          </th>
                        ))}
                        <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolled.map(s => {
                        const trimGrades = courseTrimesters.map(t => calcStudentTrimGrade(s.id, t.id));
                        const validGrades = trimGrades.filter(g => g !== null) as number[];
                        const avg = validGrades.length > 0 ? validGrades.reduce((a, b) => a + b, 0) / validGrades.length : null;
                        return (
                          <tr key={s.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/10 transition-colors">
                            <td className="px-5 py-3 text-sm text-foreground">{s.name}</td>
                            {trimGrades.map((g, idx) => (
                              <td key={idx} className="px-4 py-3 text-center" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                                <span className={`text-sm font-medium ${g !== null ? (g >= 70 ? "text-green-600" : "text-red-400") : "text-muted-foreground/40"}`}>
                                  {g !== null ? g.toFixed(1) : "—"}
                                </span>
                              </td>
                            ))}
                            <td className="px-4 py-3 text-center" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                              <span className={`text-sm font-bold ${avg !== null ? (avg >= 70 ? "text-green-600" : "text-red-400") : "text-muted-foreground/40"}`}>
                                {avg !== null ? avg.toFixed(1) : "—"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── App Shell ──────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // State
  const [courses, setCourses] = useState<Course[]>(SEED_COURSES);
  const [teachers, setTeachers] = useState<Teacher[]>(SEED_TEACHERS);
  const [students, setStudents] = useState<Student[]>(SEED_STUDENTS);
  const [trimesters, setTrimesters] = useState<Trimester[]>(SEED_TRIMESTERS);
  const [activities, setActivities] = useState<Activity[]>(SEED_ACTIVITIES);
  const [grades, setGrades] = useState<Grade[]>(SEED_GRADES);

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  const selectedCourse = courses.find(c => c.id === selectedCourseId) ?? null;

  function handleNavigate(v: View) {
    setView(v);
    if (v !== "course-detail") setSelectedCourseId(null);
  }

  function handleSelectCourse(id: number) {
    setSelectedCourseId(id);
    setView("course-detail");
  }

  return (
    <div className="flex min-h-screen bg-background" style={{ fontFamily: "Inter, sans-serif" }}>
      <Sidebar user={user} view={view} onNavigate={handleNavigate} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Top bar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{view === "course-detail" && selectedCourse ? (
              <>
                <button onClick={() => handleNavigate("courses")} className="hover:text-foreground transition-colors">Cursos</button>
                <ChevronRight className="w-3 h-3 inline mx-1" />
                <span className="text-foreground">{selectedCourse.name}</span>
              </>
            ) : (
              NAV_ITEMS.find(n => n.id === view)?.label ?? "Panel"
            )}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center">{user.avatar}</div>
              <span className="text-foreground font-medium hidden sm:block">{user.name}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{user.role === "admin" ? "Admin" : "Docente"}</span>
            </div>
            <button onClick={() => { setUser(null); setView("dashboard"); }} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded hover:bg-secondary" title="Cerrar sesión">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {view === "dashboard" && (
            <Dashboard user={user} courses={courses} students={students} teachers={teachers} trimesters={trimesters} onNavigate={handleNavigate} />
          )}
          {view === "courses" && (
            <CoursesView user={user} courses={courses} setCourses={setCourses} teachers={teachers} students={students} trimesters={trimesters} setTrimesters={setTrimesters} onSelectCourse={handleSelectCourse} />
          )}
          {view === "course-detail" && selectedCourse && (
            <CourseDetail
              user={user} course={selectedCourse} teachers={teachers}
              students={students} setStudents={setStudents}
              trimesters={trimesters} setTrimesters={setTrimesters}
              activities={activities} setActivities={setActivities}
              grades={grades} setGrades={setGrades}
              onBack={() => handleNavigate("courses")}
            />
          )}
          {view === "students" && (
            <StudentsView user={user} students={students} setStudents={setStudents} courses={courses} teachers={teachers} />
          )}
          {view === "users" && user.role === "admin" && (
            <UsersView teachers={teachers} setTeachers={setTeachers} courses={courses} />
          )}
          {view === "grades" && (
            <GradesView user={user} courses={courses} students={students} teachers={teachers} trimesters={trimesters} activities={activities} grades={grades} />
          )}
        </main>
      </div>
    </div>
  );
}
