 "use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, CalendarDays, Check, CheckCircle2, ChevronDown, Circle,
  Clock3, Filter, LayoutDashboard, ListTodo, MoreHorizontal, Plus,
  Search, SlidersHorizontal, Target, Trash2, X, AlertCircle, Flag,
  Pencil, MessageSquare, CalendarClock
} from "lucide-react";

type Status = "Not Started" | "In Progress" | "On Hold" | "Completed";
type Priority = "Low" | "Medium" | "High" | "Urgent";
type Update = { id: string; text: string; createdAt: string };
type Task = {
  id: string; title: string; description: string; category: string;
  priority: Priority; status: Status; progress: number;
  startDate: string; dueDate: string; updates: Update[]; createdAt: string;
};

const STORAGE_KEY = "taskflow.tasks.v1";
const today = () => new Date().toISOString().slice(0, 10);
const sampleTasks: Task[] = [
  { id: "sample-1", title: "Prepare quarterly business review", description: "Consolidate pipeline, wins, risks and next-quarter priorities.", category: "Work", priority: "High", status: "In Progress", progress: 65, startDate: today(), dueDate: addDays(5), updates: [{ id: "u1", text: "Collected regional sales inputs.", createdAt: new Date().toISOString() }], createdAt: new Date().toISOString() },
  { id: "sample-2", title: "Complete online course module", description: "Finish the next module and capture key takeaways.", category: "Learning", priority: "Medium", status: "Not Started", progress: 0, startDate: today(), dueDate: addDays(9), updates: [], createdAt: new Date().toISOString() },
  { id: "sample-3", title: "Review monthly expenses", description: "Check subscriptions and recurring expenses.", category: "Personal", priority: "Low", status: "Completed", progress: 100, startDate: addDays(-4), dueDate: addDays(-1), updates: [], createdAt: new Date().toISOString() }
];
function addDays(n: number) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function fmt(date: string) { if (!date) return "No date"; return new Date(date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
function isOverdue(t: Task) { return !!t.dueDate && t.dueDate < today() && t.status !== "Completed"; }

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [view, setView] = useState<"all" | "upcoming" | "overdue" | "completed">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [detail, setDetail] = useState<Task | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setTasks(raw ? JSON.parse(raw) : sampleTasks);
    } catch { setTasks(sampleTasks); }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }, [tasks, ready]);

  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.status === "Completed").length,
    active: tasks.filter(t => t.status === "In Progress").length,
    overdue: tasks.filter(isOverdue).length
  }), [tasks]);

  const filtered = useMemo(() => tasks.filter(t => {
    const matchesQuery = `${t.title} ${t.description} ${t.category}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || t.priority === priorityFilter;
    const matchesView = view === "all" ||
      (view === "upcoming" && t.status !== "Completed" && t.dueDate >= today() && t.dueDate <= addDays(7)) ||
      (view === "overdue" && isOverdue(t)) ||
      (view === "completed" && t.status === "Completed");
    return matchesQuery && matchesStatus && matchesPriority && matchesView;
  }).sort((a,b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999")), [tasks, query, statusFilter, priorityFilter, view]);

  function saveTask(data: Omit<Task, "id" | "updates" | "createdAt">, id?: string) {
    if (id) setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    else setTasks(prev => [{ ...data, id: crypto.randomUUID(), updates: [], createdAt: new Date().toISOString() }, ...prev]);
    setModalOpen(false); setEditing(null); setToast(id ? "Task updated" : "Task added");
    window.setTimeout(() => setToast(""), 2500);
  }
  function deleteTask(id: string) {
    if (!confirm("Delete this task permanently?")) return;
    setTasks(prev => prev.filter(t => t.id !== id)); setDetail(null);
  }
  function quickProgress(task: Task, progress: number) {
    const status: Status = progress === 100 ? "Completed" : progress > 0 ? "In Progress" : "Not Started";
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, progress, status } : t));
  }
  function addUpdate(task: Task, text: string) {
    const update = { id: crypto.randomUUID(), text, createdAt: new Date().toISOString() };
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, updates: [update, ...t.updates] } : t));
    setDetail({ ...task, updates: [update, ...task.updates] });
  }

  if (!ready) return <main className="loading">Loading your workspace…</main>;

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Check size={19}/></div><span>taskflow</span></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="nav">
        <button className={`nav-item ${view === "all" ? "active" : ""}`} onClick={() => setView("all")}><LayoutDashboard size={18}/> Overview</button>
        <button className={`nav-item ${view === "upcoming" ? "active" : ""}`} onClick={() => setView("upcoming")}><CalendarDays size={18}/> Upcoming <span className="nav-count">{tasks.filter(t => t.status !== "Completed" && t.dueDate >= today() && t.dueDate <= addDays(7)).length}</span></button>
        <button className={`nav-item ${view === "overdue" ? "active" : ""}`} onClick={() => setView("overdue")}><AlertCircle size={18}/> Overdue <span className="nav-count danger-count">{stats.overdue}</span></button>
        <button className={`nav-item ${view === "completed" ? "active" : ""}`} onClick={() => setView("completed")}><CheckCircle2 size={18}/> Completed</button>
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-tip"><Target size={19}/><strong>Make progress visible</strong><p>Break big goals into clear next steps and keep moving.</p></div>
        <div className="profile"><div className="avatar">Y</div><div><strong>Your workspace</strong><small>Personal account</small></div><MoreHorizontal size={18}/></div>
      </div>
    </aside>

    <section className="main-area">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> {view === "all" ? "Overview" : view[0].toUpperCase() + view.slice(1)}</div><div className="top-actions"><span className="today-label"><CalendarDays size={15}/> {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span><button className="primary-btn" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={17}/> New task</button></div></header>
      <div className="content">
        <div className="welcome-row"><div><p className="eyebrow">YOUR PRODUCTIVITY SPACE</p><h1>{view === "all" ? "Good to see you." : view === "upcoming" ? "Coming up." : view === "overdue" ? "Needs your attention." : "A record of progress."}</h1><p className="subheading">A clear view of what matters and what needs to happen next.</p></div><div className="date-chip"><span className="date-dot"/>{new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</div></div>

        <div className="stats-grid">
          <Stat icon={<ListTodo size={18}/>} label="Total tasks" value={stats.total} detail="Across your workspace" />
          <Stat icon={<Activity size={18}/>} label="In progress" value={stats.active} detail="Currently moving forward" />
          <Stat icon={<CheckCircle2 size={18}/>} label="Completed" value={stats.completed} detail={stats.total ? `${Math.round(stats.completed/stats.total*100)}% of all tasks` : "Nothing completed yet"} />
          <Stat icon={<AlertCircle size={18}/>} label="Overdue" value={stats.overdue} detail="Past their due date" warning={stats.overdue > 0}/>
        </div>

        <div className="section-heading"><div><h2>Tasks</h2><p>Organise your work and track every milestone.</p></div><button className="secondary-btn" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16}/> Add task</button></div>
        <div className="toolbar"><div className="search-box"><Search size={17}/><input placeholder="Search tasks..." value={query} onChange={e => setQuery(e.target.value)}/>{query && <button onClick={() => setQuery("")}><X size={14}/></button>}</div><div className="filter-controls"><div className="select-wrap"><Filter size={15}/><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>All</option><option>Not Started</option><option>In Progress</option><option>On Hold</option><option>Completed</option></select><ChevronDown size={14}/></div><div className="select-wrap"><Flag size={15}/><select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}><option>All</option><option>Urgent</option><option>High</option><option>Medium</option><option>Low</option></select><ChevronDown size={14}/></div></div></div>

        <div className="task-list">
          {filtered.length === 0 ? <div className="empty-state"><div className="empty-icon"><ListTodo size={25}/></div><h3>No tasks found</h3><p>Try changing your filters or add a new task to get started.</p><button className="primary-btn" onClick={() => setModalOpen(true)}><Plus size={16}/> Create a task</button></div> :
          filtered.map(task => <article className="task-card" key={task.id}>
            <button className={`task-check ${task.status === "Completed" ? "checked" : ""}`} aria-label="Mark completed" onClick={() => quickProgress(task, task.status === "Completed" ? 0 : 100)}>{task.status === "Completed" && <Check size={14}/>}</button>
            <div className="task-main">
              <div className="task-title-row"><button className={`task-title ${task.status === "Completed" ? "done-title" : ""}`} onClick={() => setDetail(task)}>{task.title}</button><span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span></div>
              {task.description && <p className="task-description">{task.description}</p>}
              <div className="task-meta"><span className="category-pill">{task.category || "General"}</span><span className={`status status-${task.status.toLowerCase().replaceAll(" ", "-")}`}><i/>{task.status}</span><span className={isOverdue(task) ? "due overdue-text" : "due"}><CalendarClock size={14}/>{task.dueDate ? (isOverdue(task) ? "Overdue · " : "Due ") + fmt(task.dueDate) : "No due date"}</span></div>
              <div className="progress-row"><div className="progress-track"><div className={`progress-fill ${task.status === "Completed" ? "complete-fill" : ""}`} style={{ width: `${task.progress}%` }}/></div><span>{task.progress}%</span><button className="tiny-edit" title="Edit task" onClick={() => { setEditing(task); setModalOpen(true); }}><Pencil size={13}/></button></div>
            </div>
            <button className="more-btn" title="Open task details" onClick={() => setDetail(task)}><MoreHorizontal size={19}/></button>
          </article>)}
        </div>
        <div className="list-footer"><span>Showing {filtered.length} of {tasks.length} tasks</span><span><span className="live-dot"/> Saved in this browser</span></div>
      </div>
    </section>

    {modalOpen && <TaskModal task={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={saveTask}/>}
    {detail && <DetailPanel task={tasks.find(t => t.id === detail.id) || detail} onClose={() => setDetail(null)} onEdit={() => { setEditing(tasks.find(t => t.id === detail.id) || detail); setDetail(null); setModalOpen(true); }} onDelete={() => deleteTask(detail.id)} onProgress={p => quickProgress(detail, p)} onAddUpdate={txt => addUpdate(detail, txt)}/>}
    {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </main>;
}

function Stat({ icon, label, value, detail, warning }: { icon: React.ReactNode; label: string; value: number; detail: string; warning?: boolean }) {
  return <div className={`stat-card ${warning ? "stat-warning" : ""}`}><div className="stat-top"><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span></div><div className="stat-value">{value}</div><div className="stat-detail">{detail}</div></div>;
}

function TaskModal({ task, onClose, onSave }: { task: Task | null; onClose: () => void; onSave: (data: Omit<Task, "id" | "updates" | "createdAt">, id?: string) => void }) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [category, setCategory] = useState(task?.category || "Work");
  const [priority, setPriority] = useState<Priority>(task?.priority || "Medium");
  const [status, setStatus] = useState<Status>(task?.status || "Not Started");
  const [progress, setProgress] = useState(task?.progress ?? 0);
  const [startDate, setStartDate] = useState(task?.startDate || today());
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); if (!title.trim()) return;
    const finalProgress = status === "Completed" ? 100 : progress;
    onSave({ title: title.trim(), description, category, priority, status: finalProgress === 100 ? "Completed" : status, progress: finalProgress, startDate, dueDate }, task?.id);
  };
  return <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><form className="modal" onSubmit={submit}>
    <div className="modal-head"><div><p className="eyebrow">{task ? "UPDATE YOUR WORK" : "MAKE IT HAPPEN"}</p><h2>{task ? "Edit task" : "Create a task"}</h2></div><button type="button" className="close-btn" onClick={onClose}><X size={19}/></button></div>
    <label className="field-label">Task title <span>*</span><input autoFocus required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Prepare client proposal"/></label>
    <label className="field-label">Description<textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Add context, details or the outcome you want..."/></label>
    <div className="form-grid"><label className="field-label">Category<input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Work, Personal"/></label><label className="field-label">Priority<select value={priority} onChange={e => setPriority(e.target.value as Priority)}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></label></div>
    <div className="form-grid"><label className="field-label">Start date<input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}/></label><label className="field-label">Due date<input type="date" min={startDate} value={dueDate} onChange={e => setDueDate(e.target.value)}/></label></div>
    <div className="form-grid"><label className="field-label">Status<select value={status} onChange={e => { setStatus(e.target.value as Status); if (e.target.value === "Completed") setProgress(100); }}><option>Not Started</option><option>In Progress</option><option>On Hold</option><option>Completed</option></select></label><label className="field-label">Progress <strong className="progress-number">{status === "Completed" ? 100 : progress}%</strong><input type="range" min="0" max="100" step="5" value={status === "Completed" ? 100 : progress} onChange={e => { setProgress(Number(e.target.value)); setStatus(Number(e.target.value) > 0 ? "In Progress" : "Not Started"); }}/></label></div>
    <div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button type="submit" className="primary-btn"><Check size={16}/>{task ? "Save changes" : "Create task"}</button></div>
  </form></div>;
}

function DetailPanel({ task, onClose, onEdit, onDelete, onProgress, onAddUpdate }: { task: Task; onClose: () => void; onEdit: () => void; onDelete: () => void; onProgress: (p: number) => void; onAddUpdate: (text: string) => void }) {
  const [note, setNote] = useState("");
  return <div className="overlay panel-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><aside className="detail-panel">
    <div className="panel-head"><span className="eyebrow">TASK DETAILS</span><div><button className="icon-btn" onClick={onEdit} title="Edit"><Pencil size={17}/></button><button className="icon-btn delete-icon" onClick={onDelete} title="Delete"><Trash2 size={17}/></button><button className="close-btn" onClick={onClose}><X size={19}/></button></div></div>
    <h2>{task.title}</h2><p className="detail-description">{task.description || "No description added."}</p>
    <div className="detail-tags"><span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority} priority</span><span className={`status status-${task.status.toLowerCase().replaceAll(" ", "-")}`}><i/>{task.status}</span></div>
    <div className="detail-dates"><div><small>START DATE</small><strong>{fmt(task.startDate)}</strong></div><div><small>DUE DATE</small><strong className={isOverdue(task) ? "overdue-text" : ""}>{fmt(task.dueDate)}</strong></div></div>
    <div className="detail-progress"><div className="detail-progress-head"><strong>Progress</strong><strong>{task.progress}%</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${task.progress}%` }}/></div><input aria-label="Update progress" type="range" min="0" max="100" step="5" value={task.progress} onChange={e => onProgress(Number(e.target.value))}/></div>
    <div className="updates-section"><h3><MessageSquare size={17}/> Progress updates <span>{task.updates.length}</span></h3><form className="update-form" onSubmit={e => { e.preventDefault(); if (note.trim()) { onAddUpdate(note.trim()); setNote(""); } }}><textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="What changed? Add a progress note..."/><button className="primary-btn" type="submit" disabled={!note.trim()}>Add update</button></form>
      {task.updates.length ? <div className="update-list">{task.updates.map(u => <div className="update-item" key={u.id}><div className="update-marker"/><div><p>{u.text}</p><small>{new Date(u.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small></div></div>)}</div> : <p className="no-updates">No updates yet. Add a note to keep a record of progress.</p>}
    </div>
  </aside></div>;
}
