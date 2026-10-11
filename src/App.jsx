import { useEffect, useMemo, useState } from 'react'
import {
  Check, Plus, Search, Sun, Moon, LayoutGrid, CalendarDays,
  CircleCheck, Clock3, Trash2, Pencil, X, Sparkles, ChevronDown,
  Flag, ListTodo, Circle
} from 'lucide-react'

const todayISO = (offset = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const initialTasks = [
  { id: 1, title: 'Plan the week ahead', category: 'Personal', priority: 'High', due: todayISO(), done: false },
  { id: 2, title: 'Review project milestones', category: 'Work', priority: 'High', due: todayISO(), done: false },
  { id: 3, title: 'Read 20 pages of a book', category: 'Personal', priority: 'Low', due: todayISO(1), done: true },
  { id: 4, title: 'Send the design feedback', category: 'Work', priority: 'Medium', due: todayISO(1), done: false },
  { id: 5, title: 'Go for an evening walk', category: 'Health', priority: 'Medium', due: todayISO(2), done: false },
]

function formatDue(date) {
  if (!date) return 'No due date'
  if (date === todayISO()) return 'Today'
  if (date === todayISO(1)) return 'Tomorrow'
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function TaskForm({ task, onSave, onClose }) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [category, setCategory] = useState(task?.category ?? 'Work')
  const [priority, setPriority] = useState(task?.priority ?? 'Medium')
  const [due, setDue] = useState(task?.due ?? todayISO())

  function submit(event) {
    event.preventDefault()
    if (!title.trim()) return
    onSave({ title: title.trim(), category, priority, due })
  }

  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <form className="task-modal" onSubmit={submit}>
        <div className="modal-heading">
          <div><span className="modal-kicker">{task ? 'MAKE IT BETTER' : 'MAKE IT HAPPEN'}</span>
            <h2>{task ? 'Edit task' : 'Create a task'}</h2>
            <p>Give your next step a name.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        <label className="field-label">Task name
          <input autoFocus required maxLength={140} placeholder="e.g. Finish project proposal" value={title} onChange={e => setTitle(e.target.value)} />
        </label>
        <div className="form-two">
          <label className="field-label">Category
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option>Work</option><option>Personal</option><option>Health</option>
            </select>
          </label>
          <label className="field-label">Priority
            <select value={priority} onChange={e => setPriority(e.target.value)}>
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
          </label>
        </div>
        <label className="field-label">Due date
          <input type="date" value={due} onChange={e => setDue(e.target.value)} />
        </label>
        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" type="submit"><Plus size={17} />{task ? 'Save changes' : 'Create task'}</button>
        </div>
      </form>
    </div>
  )
}

function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const overdue = task.due && task.due < todayISO() && !task.done
  return (
    <article className={`task-row ${task.done ? 'task-done' : ''}`}>
      <button className={`task-check ${task.done ? 'checked' : ''}`} onClick={() => onToggle(task.id)}
        aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}>
        {task.done && <Check size={14} strokeWidth={3} />}
      </button>
      <div className="task-info">
        <div className="task-name">{task.title}</div>
        <div className="task-meta">
          <span className={`task-category ${task.category.toLowerCase()}`}>{task.category}</span>
          <span className="meta-separator">·</span>
          <span className={`priority ${task.priority.toLowerCase()}`}><span />{task.priority}</span>
        </div>
      </div>
      <div className={`due-date ${overdue ? 'overdue' : ''}`}><CalendarDays size={14} />{formatDue(task.due)}</div>
      <div className="task-actions">
        <button onClick={() => onEdit(task)} title="Edit task" aria-label="Edit task"><Pencil size={15} /></button>
        <button onClick={() => onDelete(task.id)} title="Delete task" aria-label="Delete task"><Trash2 size={15} /></button>
      </div>
    </article>
  )
}

export default function App() {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('taskflow-tasks')
      return saved ? JSON.parse(saved) : initialTasks
    } catch {
      return initialTasks
    }
  })
  const [filter, setFilter] = useState('All tasks')
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [formTask, setFormTask] = useState(undefined)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    localStorage.setItem('taskflow-tasks', JSON.stringify(tasks))
  }, [tasks])

  const completed = tasks.filter(task => task.done).length
  const pending = tasks.length - completed
  const navItems = [
    { label: 'All tasks', icon: LayoutGrid, count: tasks.length },
    { label: 'Today', icon: Sun, count: tasks.filter(t => t.due === todayISO() && !t.done).length },
    { label: 'Upcoming', icon: CalendarDays, count: tasks.filter(t => t.due > todayISO() && !t.done).length },
    { label: 'Completed', icon: CircleCheck, count: completed },
  ]

  const visibleTasks = useMemo(() => tasks.filter(task => {
    const matchesFilter =
      filter === 'All tasks' ||
      (filter === 'Today' && task.due === todayISO() && !task.done) ||
      (filter === 'Upcoming' && task.due > todayISO() && !task.done) ||
      (filter === 'Completed' && task.done)
    return matchesFilter &&
      (category === 'All' || task.category === category) &&
      task.title.toLowerCase().includes(search.toLowerCase())
  }).sort((a, b) => Number(a.done) - Number(b.done) || (a.due || '9999').localeCompare(b.due || '9999')), [tasks, filter, category, search])

  function saveTask(data) {
    if (formTask && formTask !== 'new') {
      setTasks(old => old.map(task => task.id === formTask.id ? { ...task, ...data } : task))
    } else {
      setTasks(old => [{ ...data, id: Date.now(), done: false }, ...old])
    }
    setFormTask(undefined)
  }

  const heading = {
    'All tasks': 'Make today count.',
    Today: 'Today’s focus.',
    Upcoming: 'Coming up next.',
    Completed: 'Look how far you’ve come.',
  }[filter]

  return (
    <div className={`app-shell ${dark ? 'dark' : ''}`}>
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Check size={20} strokeWidth={3} /></div><span>taskflow<span className="brand-dot">.</span></span></div>
        <div className="workspace-label">WORKSPACE <span>•••</span></div>
        <nav className="nav-list">
          {navItems.map(({ label, icon: Icon, count }) => (
            <button key={label} className={`nav-item ${filter === label ? 'active' : ''}`} onClick={() => setFilter(label)}>
              <Icon size={18} /><span>{label}</span><span className="nav-count">{count}</span>
            </button>
          ))}
        </nav>
        <div className="side-divider" />
        <div className="workspace-label">CATEGORIES <button className="tiny-add" onClick={() => setFormTask('new')} aria-label="Add task"><Plus size={15} /></button></div>
        <div className="category-list">
          {[['All', 'All tasks'], ['Work', 'Work'], ['Personal', 'Personal'], ['Health', 'Health']].map(([key, label]) => (
            <button key={key} onClick={() => setCategory(key)} className={`category-item ${category === key ? 'category-active' : ''}`}>
              <span className={`category-dot ${key.toLowerCase()}`} />{label}
              {key === 'All' && <span className="category-total">{tasks.length}</span>}
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={18} /></div>
            <strong>A little progress<br />each day adds up.</strong>
            <p>Keep showing up for yourself.</p>
            <div className="mini-progress"><span style={{ width: `${tasks.length ? completed / tasks.length * 100 : 0}%` }} /></div>
            <small>{completed} of {tasks.length} tasks completed</small>
          </div>
          <button className="theme-toggle" onClick={() => setDark(value => !value)}>{dark ? <Sun size={17} /> : <Moon size={17} />}<span>{dark ? 'Light mode' : 'Dark mode'}</span></button>
          <div className="profile"><div className="avatar">Y</div><div className="profile-text"><strong>Your workspace</strong><span>Personal plan</span></div><ChevronDown size={16} /></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{filter}</strong></div>
          <div className="top-actions">
            <div className="search-box"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." aria-label="Search tasks" /></div>
            <div className="top-avatar">Y</div>
          </div>
        </header>
        <section className="content-wrap">
          <div className="welcome-row">
            <div><div className="eyebrow"><span className="eyebrow-line" /> YOUR PERSONAL PRODUCTIVITY HUB</div>
              <h1>{heading}</h1><p className="subtitle">Small steps, big momentum. Let’s get things done.</p>
            </div>
            <button className="primary-btn" onClick={() => setFormTask('new')}><Plus size={18} /> Add new task</button>
          </div>

          <div className="stats-grid">
            <div className="stat-card"><div className="stat-top"><span>Total tasks</span><span className="stat-icon lavender"><ListTodo size={18} /></span></div><div className="stat-number">{tasks.length}<span className="stat-caption">in your list</span></div><div className="stat-foot"><span className="stat-bullet purple" />Stay organized, stay focused</div></div>
            <div className="stat-card"><div className="stat-top"><span>In progress</span><span className="stat-icon peach"><Clock3 size={18} /></span></div><div className="stat-number">{pending}<span className="stat-caption">to work on</span></div><div className="stat-foot"><span className="stat-bullet orange" />One thing at a time</div></div>
            <div className="stat-card"><div className="stat-top"><span>Completed</span><span className="stat-icon mint"><CircleCheck size={18} /></span></div><div className="stat-number">{completed}<span className="stat-caption">you did it!</span></div><div className="stat-foot"><span className="stat-bullet green" />{tasks.length ? Math.round(completed / tasks.length * 100) : 0}% completion rate</div></div>
          </div>

          <section className="tasks-panel">
            <div className="panel-header"><div><h2><span className="panel-title-icon"><ListTodo size={19} /></span>Your tasks <span className="task-pill">{visibleTasks.length}</span></h2><p>Keep your priorities in check.</p></div>
              <label className="filter-select"><Flag size={14} /><select aria-label="Filter by category" value={category} onChange={e => setCategory(e.target.value)}><option value="All">All categories</option><option>Work</option><option>Personal</option><option>Health</option></select><ChevronDown size={14} /></label>
            </div>
            <div className="task-tabs">{['All tasks', 'Today', 'Upcoming', 'Completed'].map(tab => <button key={tab} onClick={() => setFilter(tab)} className={filter === tab ? 'tab-active' : ''}>{tab}{tab === 'All tasks' && <span>{tasks.length}</span>}</button>)}</div>
            <div className="task-list">
              {visibleTasks.map(task => <TaskItem key={task.id} task={task}
                onToggle={id => setTasks(old => old.map(t => t.id === id ? { ...t, done: !t.done } : t))}
                onEdit={setFormTask}
                onDelete={id => setTasks(old => old.filter(t => t.id !== id))} />)}
              {!visibleTasks.length && <div className="empty-state"><div className="empty-icon"><Circle size={24} /></div><h3>{search ? 'No matching tasks' : 'All clear for now'}</h3><p>{search ? 'Try another search term.' : 'Add a task to get your momentum going.'}</p>{!search && <button className="primary-btn" onClick={() => setFormTask('new')}><Plus size={16} />Create a task</button>}</div>}
            </div>
            <div className="panel-footer"><span>Showing <strong>{visibleTasks.length}</strong> of <strong>{tasks.length}</strong> tasks</span><span className="footer-note"><span className="online-dot" />Saved automatically on this device</span></div>
          </section>
          <footer className="page-footer">Made for your focus <span>✳</span> One task at a time.</footer>
        </section>
      </main>
      {formTask && <TaskForm key={formTask === 'new' ? 'new' : formTask.id} task={formTask === 'new' ? null : formTask} onSave={saveTask} onClose={() => setFormTask(undefined)} />}
    </div>
  )
}