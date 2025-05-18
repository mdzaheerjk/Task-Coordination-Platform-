// Simple localStorage-based to-do list with project filter
let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const projectInput = document.getElementById('projectInput');
const taskList = document.getElementById('taskList');
const projectFilter = document.getElementById('projectFilter');

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderProjects() {
    const projects = [...new Set(tasks.map(t => t.project))];
    projectFilter.innerHTML = `<option value="all">All Projects</option>` +
        projects.map(p => `<option value="${p}">${p}</option>`).join('');
}

function renderTasks() {
    const filter = projectFilter.value;
    taskList.innerHTML = '';
    tasks
        .filter(t => filter === 'all' || t.project === filter)
        .forEach((task, idx) => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <div>
                    <input type="checkbox" class="form-check-input me-2" ${task.completed ? 'checked' : ''} data-idx="${idx}">
                    <span class="${task.completed ? 'text-decoration-line-through text-muted' : ''}">${task.text}</span>
                    <span class="badge bg-secondary ms-2">${task.project}</span>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-success me-1 edit-btn" data-idx="${idx}">Edit</button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-idx="${idx}">Delete</button>
                </div>
            `;
            taskList.appendChild(li);
        });
}

taskForm.onsubmit = e => {
    e.preventDefault();
    tasks.push({
        text: taskInput.value,
        project: projectInput.value,
        completed: false
    });
    saveTasks();
    renderProjects();
    renderTasks();
    taskForm.reset();
};

taskList.onclick = e => {
    const idx = e.target.dataset.idx;
    if (e.target.classList.contains('delete-btn')) {
        tasks.splice(idx, 1);
        saveTasks();
        renderProjects();
        renderTasks();
    }
    if (e.target.classList.contains('edit-btn')) {
        const newText = prompt('Edit task:', tasks[idx].text);
        if (newText !== null && newText.trim() !== '') {
            tasks[idx].text = newText;
            saveTasks();
            renderTasks();
        }
    }
    if (e.target.type === 'checkbox') {
        tasks[idx].completed = e.target.checked;
        saveTasks();
        renderTasks();
    }
};

projectFilter.onchange = renderTasks;

// Initial render
renderProjects();
renderTasks();

document.addEventListener('DOMContentLoaded', function() {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // Add new task
    function addTask(title, priority = 'medium') {
        const task = {
            id: Date.now(),
            title,
            priority,
            completed: false,
            createdAt: new Date().toISOString()
        };
        tasks.push(task);
        saveTasks();
        renderTasks();
    }

    // Toggle task completion
    function toggleTask(id) {
        tasks = tasks.map(task => 
            task.id === id ? {...task, completed: !task.completed} : task
        );
        saveTasks();
        renderTasks();
    }

    // Delete task
    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }

    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Render tasks
    function renderTasks() {
        const taskList = document.getElementById('taskList');
        if (!taskList) return;

        taskList.innerHTML = tasks.map(task => `
            <div class="task-card ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="d-flex align-items-center">
                    <input type="checkbox" class="task-checkbox" 
                           ${task.completed ? 'checked' : ''} 
                           onchange="toggleTask(${task.id})">
                    <div class="task-priority ${task.priority}"></div>
                    <div class="task-text">${task.title}</div>
                    <button class="btn btn-sm btn-danger ms-auto" 
                            onclick="deleteTask(${task.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Initialize tasks
    renderTasks();

    // Drag and drop functionality
    const taskList = document.getElementById('taskList');
    let draggedItem = null;

    taskList.addEventListener('dragstart', (e) => {
        draggedItem = e.target;
        e.target.style.opacity = '0.5';
    });

    taskList.addEventListener('dragend', (e) => {
        e.target.style.opacity = '1';
    });

    taskList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(taskList, e.clientY);
        const current = document.querySelector('.dragging');
        if (afterElement == null) {
            taskList.appendChild(draggedItem);
        } else {
            taskList.insertBefore(draggedItem, afterElement);
        }
    });

    // Task completion animation
    function completeTask(taskId) {
        const task = document.querySelector(`[data-task-id="${taskId}"]`);
        task.style.transform = 'scale(0.95)';
        setTimeout(() => {
            task.style.transform = 'scale(1)';
            task.classList.add('completed');
        }, 200);
    }

    // Priority color coding
    function updatePriorityColor(taskId, priority) {
        const task = document.querySelector(`[data-task-id="${taskId}"]`);
        const colors = {
            high: '#ff4757',
            medium: '#ffa502',
            low: '#2ed573'
        };
        task.style.borderLeft = `4px solid ${colors[priority]}`;
    }
}); 