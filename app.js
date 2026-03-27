const input = document.getElementById("task-title");
const descriptionInput = document.getElementById("task-description");
const dateInput = document.getElementById("task-date");
const addTaskBtn = document.getElementById("add-task");
const taskList = document.getElementById("task-list");
const taskCount = document.getElementById("task-count");
const clearDoneBtn = document.getElementById("clear-done");
const filterButtons = document.querySelectorAll(".filter-btn");
const totalCount = document.getElementById("total-count");
const activeCount = document.getElementById("active-count");
const doneCount = document.getElementById("done-count");

const STORAGE_KEY = "task-manager-items";
let tasks = loadTasks();
let currentFilter = "all";
initGradientMotion();

render();

addTaskBtn.addEventListener("click", addTask);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

clearDoneBtn.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  persistAndRender();
});

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    render();
  });
});

function addTask() {
  const title = input.value.trim();
  const description = descriptionInput ? descriptionInput.value.trim() : "";
  const dueDate = dateInput ? dateInput.value : "";
  if (!title) return;

  tasks.unshift({
    id: crypto.randomUUID(),
    title,
    description,
    dueDate,
    done: false,
    createdAt: Date.now(),
  });

  input.value = "";
  if (descriptionInput) descriptionInput.value = "";
  if (dateInput) dateInput.value = "";
  persistAndRender();
}

function toggleTask(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, done: !task.done } : task
  );
  persistAndRender();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  persistAndRender();
}

function render() {
  taskList.innerHTML = "";

  const filtered = tasks.filter((task) => {
    if (currentFilter === "active") return !task.done;
    if (currentFilter === "done") return task.done;
    return true;
  });

  if (!filtered.length) {
    const empty = document.createElement("li");
    empty.className = "task-item empty-state";
    empty.innerHTML = '<span class="title">No tasks yet for this filter.</span>';
    taskList.appendChild(empty);
  } else {
    filtered.forEach((task) => {
      const li = document.createElement("li");
      li.className = `task-item ${task.done ? "done" : ""}`;
      const safeDescription = task.description
        ? escapeHtml(task.description)
        : "No description";
      const dueDateLabel = task.dueDate ? formatTaskDate(task.dueDate) : "No date";
      const createdAtLabel = task.createdAt ? formatTaskDate(task.createdAt) : "Unknown";

      li.innerHTML = `
        <input type="checkbox" ${task.done ? "checked" : ""} aria-label="Toggle task">
        <div class="task-content">
          <span class="title">${escapeHtml(task.title)}</span>
          <p class="description">${safeDescription}</p>
          <div class="task-meta">
            <span class="task-date">Due: ${dueDateLabel}</span>
            <span class="task-created">Created: ${createdAtLabel}</span>
          </div>
        </div>
        <button aria-label="Delete task">Delete</button>
      `;

      li.querySelector('input[type="checkbox"]').addEventListener("change", () => {
        toggleTask(task.id);
      });

      li.querySelector("button").addEventListener("click", () => {
        deleteTask(task.id);
      });

      taskList.appendChild(li);
    });
  }

  const remaining = tasks.filter((task) => !task.done).length;
  const completed = tasks.length - remaining;
  taskCount.textContent = `${remaining} active / ${tasks.length} total`;

  if (totalCount) totalCount.textContent = String(tasks.length);
  if (activeCount) activeCount.textContent = String(remaining);
  if (doneCount) doneCount.textContent = String(completed);
}

function persistAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  render();
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatTaskDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function initGradientMotion() {
  const root = document.documentElement;
  let pointerX = 0;
  let pointerY = 0;
  let currentX = 0;
  let currentY = 0;

  window.addEventListener("pointermove", (event) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    pointerX = ((event.clientX - cx) / cx) * 18;
    pointerY = ((event.clientY - cy) / cy) * 18;
  });

  window.addEventListener("pointerleave", () => {
    pointerX = 0;
    pointerY = 0;
  });

  const start = performance.now();

  function tick(now) {
    const t = (now - start) / 1000;

    const ambientX = Math.sin(t * 0.35) * 8;
    const ambientY = Math.cos(t * 0.28) * 6;

    const targetX = pointerX + ambientX;
    const targetY = pointerY + ambientY;

    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    root.style.setProperty("--gx", `${currentX.toFixed(2)}px`);
    root.style.setProperty("--gy", `${currentY.toFixed(2)}px`);

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
