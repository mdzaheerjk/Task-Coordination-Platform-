// Database class
class Database {
    constructor() {
        this.data = {
            users: [],
            tasks: [],
            analytics: {
                dailyTaskCompletion: {},
                productivityTrends: {},
                projectStats: {},
                weeklyCompletion: {}
            }
        };
        this.loadData();
    }

    async loadData() {
        try {
            const response = await fetch('/data/database.json');
            this.data = await response.json();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async saveData() {
        try {
            const response = await fetch('/data/database.json', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.data)
            });
            if (!response.ok) throw new Error('Failed to save data');
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    async findUserByEmail(email) {
        await this.ensureDataLoaded();
        return this.data.users.find(user => user.email === email);
    }

    async addUser(userData) {
        await this.ensureDataLoaded();
        if (await this.findUserByEmail(userData.email)) {
            throw new Error('Email already registered');
        }
        const newUser = {
            id: Date.now().toString(),
            ...userData,
            createdAt: new Date().toISOString()
        };
        this.data.users.push(newUser);
        await this.saveData();
        return newUser;
    }

    async recordLogin(userId) {
        await this.ensureDataLoaded();
        const user = this.data.users.find(u => u.id === userId);
        if (user) {
            user.lastLogin = new Date().toISOString();
            await this.saveData();
        }
    }

    async getUserTasks(userId) {
        await this.ensureDataLoaded();
        return this.data.tasks.filter(task => task.userId === userId);
    }

    async addTask(taskData) {
        await this.ensureDataLoaded();
        const newTask = {
            id: Date.now().toString(),
            ...taskData,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        this.data.tasks.push(newTask);
        await this.saveData();
        await this.updateAnalytics(taskData.userId);
        return newTask;
    }

    async updateTaskStatus(taskId, status) {
        await this.ensureDataLoaded();
        const task = this.data.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = status;
            if (status === 'completed') {
                task.completedAt = new Date().toISOString();
                await this.updateWeeklyCompletion(task.userId);
            }
            await this.saveData();
            await this.updateAnalytics(task.userId);
        }
    }

    async updateWeeklyCompletion(userId) {
        const now = new Date();
        const weekNumber = this.getWeekNumber(now);
        const weekKey = `${now.getFullYear()}-W${weekNumber}`;
        
        if (!this.data.analytics.weeklyCompletion[userId]) {
            this.data.analytics.weeklyCompletion[userId] = {};
        }
        
        if (!this.data.analytics.weeklyCompletion[userId][weekKey]) {
            this.data.analytics.weeklyCompletion[userId][weekKey] = {
                monday: 0, tuesday: 0, wednesday: 0, thursday: 0,
                friday: 0, saturday: 0, sunday: 0
            };
        }

        const dayOfWeek = now.getDay();
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
        this.data.analytics.weeklyCompletion[userId][weekKey][dayName]++;

        await this.saveData();
    }

    async getWeeklyCompletionData(userId) {
        await this.ensureDataLoaded();
        const now = new Date();
        const weekNumber = this.getWeekNumber(now);
        const weekKey = `${now.getFullYear()}-W${weekNumber}`;
        
        return this.data.analytics.weeklyCompletion[userId]?.[weekKey] || {
            monday: 0, tuesday: 0, wednesday: 0, thursday: 0,
            friday: 0, saturday: 0, sunday: 0
        };
    }

    async deleteTask(taskId) {
        await this.ensureDataLoaded();
        const taskIndex = this.data.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const task = this.data.tasks[taskIndex];
            this.data.tasks.splice(taskIndex, 1);
            await this.saveData();
            await this.updateAnalytics(task.userId);
        }
    }

    async updateAnalytics(userId) {
        const userTasks = await this.getUserTasks(userId);
        const completed = userTasks.filter(t => t.status === 'completed').length;
        const total = userTasks.length;

        // Update daily completion
        const today = new Date().toISOString().split('T')[0];
        this.data.analytics.dailyTaskCompletion[userId] = {
            ...this.data.analytics.dailyTaskCompletion[userId],
            [today]: { completed, total }
        };

        // Update project stats
        const projectStats = {};
        userTasks.forEach(task => {
            if (!projectStats[task.project]) {
                projectStats[task.project] = { total: 0, completed: 0 };
            }
            projectStats[task.project].total++;
            if (task.status === 'completed') {
                projectStats[task.project].completed++;
            }
        });
        this.data.analytics.projectStats[userId] = projectStats;

        await this.saveData();
    }

    async getDashboardData(userId) {
        await this.ensureDataLoaded();
        const userTasks = this.data.tasks.filter(t => t.userId === userId);
        const completed = userTasks.filter(t => t.status === 'completed').length;
        const pending = userTasks.length - completed;
        const projects = [...new Set(userTasks.map(t => t.project))];

        // Get weekly productivity data
        const now = new Date();
        const weekNumber = this.getWeekNumber(now);
        const weekKey = `${now.getFullYear()}-W${weekNumber}`;
        const weeklyData = this.data.analytics.productivityTrends[userId]?.weekly[weekKey] || {
            monday: 0, tuesday: 0, wednesday: 0, thursday: 0,
            friday: 0, saturday: 0, sunday: 0
        };

        return {
            totalProjects: projects.length,
            totalTasks: userTasks.length,
            completed,
            pending,
            weeklyProductivity: Object.values(weeklyData),
            projectStats: this.data.analytics.projectStats[userId] || {}
        };
    }

    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    async ensureDataLoaded() {
        if (!this.data.users.length) {
            await this.loadData();
        }
    }
}

// Initialize database
const database = new Database();

// Page Management
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.auth-page, .app-page').forEach(page => {
        page.classList.add('d-none');
    });

    // Show selected page
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.remove('d-none');
    }

    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick')?.includes(pageId)) {
            link.classList.add('active');
        }
    });
}

// Authentication Management
function checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        document.getElementById('authPages').classList.add('d-none');
        document.getElementById('appPages').classList.remove('d-none');
        showPage('dashboardPage');
        updateDashboard();
    } else {
        document.getElementById('authPages').classList.remove('d-none');
        document.getElementById('appPages').classList.add('d-none');
        showPage('loginPage');
    }
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    checkAuth();
}

// Login Form Handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
    }

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitButton = document.getElementById('loginSubmitButton');
    const buttonText = submitButton.querySelector('.btn-text');
    const spinner = submitButton.querySelector('.spinner-border');

    // Show loading state
    submitButton.disabled = true;
    buttonText.style.display = 'none';
    spinner.classList.remove('d-none');

    try {
        const user = await database.findUserByEmail(email);
        
        if (!user || user.password !== password) {
            throw new Error('Invalid email or password');
        }

        // Record login
        await database.recordLogin(user.id);

        // Store user info in localStorage
        localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email
        }));

        // Show app pages
        checkAuth();
    } catch (error) {
        showAlert('loginAlertContainer', error.message);
    } finally {
        // Reset loading state
        submitButton.disabled = false;
        buttonText.style.display = 'inline';
        spinner.classList.add('d-none');
    }
});

// Registration Form Handler
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
    }

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitButton = document.getElementById('registerSubmitButton');
    const buttonText = submitButton.querySelector('.btn-text');
    const spinner = submitButton.querySelector('.spinner-border');

    if (password !== confirmPassword) {
        showAlert('registerAlertContainer', 'Passwords do not match');
        return;
    }

    // Show loading state
    submitButton.disabled = true;
    buttonText.style.display = 'none';
    spinner.classList.remove('d-none');

    try {
        const user = await database.addUser({
            name: fullName,
            email: email,
            password: password
        });

        // Store user info in localStorage
        localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email
        }));

        // Record login
        await database.recordLogin(user.id);

        // Show app pages
        checkAuth();
    } catch (error) {
        if (error.message === 'Email already registered') {
            showAlert('registerAlertContainer', 'This email is already registered. Please use a different email or login.');
        } else {
            showAlert('registerAlertContainer', 'An error occurred during registration. Please try again.');
            console.error('Registration error:', error);
        }
    } finally {
        // Reset loading state
        submitButton.disabled = false;
        buttonText.style.display = 'inline';
        spinner.classList.add('d-none');
    }
});

// Task Management
let taskChartInstance = null;
let trendChartInstance = null;

async function updateDashboard() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const data = await database.getDashboardData(currentUser.id);
    const weeklyData = await database.getWeeklyCompletionData(currentUser.id);
    
    // Update statistics
    document.getElementById('totalProjects').textContent = data.totalProjects;
    document.getElementById('totalTasks').textContent = data.totalTasks;
    document.getElementById('completedTasks').textContent = data.completed;
    document.getElementById('pendingTasks').textContent = data.pending;
    
    // Destroy existing charts if they exist
    if (taskChartInstance) {
        taskChartInstance.destroy();
    }
    if (trendChartInstance) {
        trendChartInstance.destroy();
    }
    
    // Pie Chart
    taskChartInstance = new Chart(document.getElementById('taskChart'), {
        type: 'pie',
        data: {
            labels: ['Completed', 'Pending'],
            datasets: [{
                data: [data.completed, data.pending],
                backgroundColor: ['#198754', '#ffc107']
            }]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 800,
                easing: 'easeInOutQuart'
            }
        }
    });

    // Line Chart with live data
    trendChartInstance = new Chart(document.getElementById('trendChart'), {
        type: 'line',
        data: {
            labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            datasets: [{
                label: 'Tasks Completed',
                data: [
                    weeklyData.sunday,
                    weeklyData.monday,
                    weeklyData.tuesday,
                    weeklyData.wednesday,
                    weeklyData.thursday,
                    weeklyData.friday,
                    weeklyData.saturday
                ],
                borderColor: '#4a90e2',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(74, 144, 226, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 800,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Weekly Progress'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Task Form Handler
document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const taskInput = document.getElementById('taskInput');
    const projectInput = document.getElementById('projectInput');
    const priorityInput = document.getElementById('priorityInput');
    const descriptionInput = document.getElementById('descriptionInput');
    const dueDateInput = document.getElementById('dueDateInput');

    try {
        await database.addTask({
            userId: currentUser.id,
            title: taskInput.value,
            project: projectInput.value,
            priority: priorityInput.value,
            description: descriptionInput.value,
            dueDate: dueDateInput.value
        });

        taskInput.value = '';
        projectInput.value = '';
        priorityInput.value = '';
        descriptionInput.value = '';
        dueDateInput.value = '';
        updateDashboard();
        updateTaskList();
    } catch (error) {
        console.error('Error adding task:', error);
    }
});

async function updateTaskList() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const tasks = await database.getUserTasks(currentUser.id);
    const taskList = document.getElementById('taskList');
    
    taskList.innerHTML = tasks.map(task => {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const isOverdue = dueDate && dueDate < new Date() && task.status !== 'completed';
        const dueDateFormatted = dueDate ? dueDate.toLocaleDateString() : 'No due date';
        
        return `
            <li class="list-group-item task-item ${task.status} ${isOverdue ? 'overdue' : ''}">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="d-flex align-items-center flex-grow-1">
                    <div class="form-check me-3">
                        <input class="form-check-input task-checkbox" type="checkbox" 
                            ${task.status === 'completed' ? 'checked' : ''}
                            onchange="updateTaskStatus('${task.id}', this.checked ? 'completed' : 'pending')">
                    </div>
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center">
                        <h6 class="mb-0 ${task.status === 'completed' ? 'text-decoration-line-through text-muted' : ''}">${task.title}</h6>
                                <span class="badge bg-${getPriorityColor(task.priority)} ms-2">${task.priority}</span>
                    </div>
                            ${task.description ? `<p class="text-muted mb-0 mt-1 small">${task.description}</p>` : ''}
                            <div class="d-flex align-items-center mt-1">
                                <small class="text-muted me-3">${task.project}</small>
                                <small class="text-${isOverdue ? 'danger' : 'muted'}">
                                    <i class="bi bi-calendar-event me-1"></i>${dueDateFormatted}
                                </small>
                </div>
                        </div>
                    </div>
                    <div class="btn-group ms-3">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTask('${task.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </li>
        `;
    }).join('');
}

function getPriorityColor(priority) {
    switch(priority) {
        case 'high':
            return 'danger';
        case 'medium':
            return 'warning';
        case 'low':
            return 'success';
        default:
            return 'secondary';
    }
}

async function updateTaskStatus(taskId, status) {
    try {
        await database.updateTaskStatus(taskId, status);
        await updateDashboard();
        updateTaskList();
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

async function deleteTask(taskId) {
    try {
        await database.deleteTask(taskId);
        updateDashboard();
        updateTaskList();
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

// Utility Functions
function showAlert(containerId, message, type = 'danger') {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}

// Feedback Form Handler
document.getElementById('feedbackForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const rating = document.querySelector('.rating-stars i.active')?.dataset.rating || 0;
    const likes = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    const improvements = document.querySelector('textarea').value;
    const recommendation = document.querySelector('input[name="recommend"]:checked')?.value;

    try {
        // Here you would typically send this data to your backend
        console.log('Feedback submitted:', { rating, likes, improvements, recommendation });
        
        // Show success message
        showAlert('feedbackForm', 'Thank you for your feedback!', 'success');
        
        // Reset form
        e.target.reset();
        document.querySelectorAll('.rating-stars i').forEach(star => star.classList.remove('active'));
    } catch (error) {
        showAlert('feedbackForm', 'Error submitting feedback. Please try again.', 'danger');
    }
});

// Star Rating Handler
document.querySelectorAll('.rating-stars i').forEach(star => {
    star.addEventListener('click', () => {
        const rating = parseInt(star.dataset.rating);
        document.querySelectorAll('.rating-stars i').forEach(s => {
            s.classList.toggle('active', parseInt(s.dataset.rating) <= rating);
        });
    });
});

// Leaderboard Management
async function updateLeaderboard() {
    const leaderboardBody = document.getElementById('leaderboardBody');
    if (!leaderboardBody) return;

    try {
        // Get all users and their tasks
        const users = await database.data.users;
        const tasks = await database.data.tasks;

        // Calculate user stats
        const userStats = users.map(user => {
            const userTasks = tasks.filter(task => task.userId === user.id);
            const completedTasks = userTasks.filter(task => task.status === 'completed').length;
            const points = completedTasks * 10; // 10 points per completed task
            const streak = calculateStreak(userTasks);

            return {
                id: user.id,
                name: user.name,
                completedTasks,
                points,
                streak
            };
        });

        // Sort by points
        userStats.sort((a, b) => b.points - a.points);

        // Update leaderboard table
        leaderboardBody.innerHTML = userStats.map((user, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-circle me-2">
                            ${user.name.charAt(0).toUpperCase()}
                        </div>
                        ${user.name}
                    </div>
                </td>
                <td>${user.completedTasks}</td>
                <td>${user.points}</td>
                <td>
                    <span class="badge bg-success">${user.streak} days</span>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error updating leaderboard:', error);
    }
}

function calculateStreak(tasks) {
    if (!tasks.length) return 0;

    const completedDates = tasks
        .filter(task => task.status === 'completed')
        .map(task => new Date(task.completedAt).toDateString());

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    while (completedDates.includes(currentDate.toDateString())) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
}

// Update leaderboard when showing the page
document.querySelector('a[onclick="showPage(\'leaderboardPage\')"]')?.addEventListener('click', () => {
    updateLeaderboard();
});

// AI Assistant Management
document.getElementById('aiChatForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const input = document.getElementById('aiMessageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    input.value = '';
    
    try {
        // Simulate AI response (replace with actual AI integration)
        const response = await simulateAIResponse(message);
        addMessageToChat(response, 'ai');
    } catch (error) {
        console.error('Error getting AI response:', error);
        addMessageToChat('Sorry, I encountered an error. Please try again.', 'ai');
    }
});

function addMessageToChat(message, type) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${message}</p>
        </div>
        <small class="text-muted">${timeString}</small>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function simulateAIResponse(message) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple response logic (replace with actual AI integration)
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return 'Hello! How can I help you today?';
    } else if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
        return 'I can help you manage your tasks. Would you like to create a new task or view your existing ones?';
    } else if (lowerMessage.includes('schedule') || lowerMessage.includes('plan')) {
        return 'I can help you plan your day. Would you like me to suggest a schedule based on your tasks?';
    } else {
        return 'I understand you\'re asking about "' + message + '". How can I assist you with that?';
    }
}

function handleQuickAction(action) {
    const messages = {
        schedule: 'I\'ll help you schedule your tasks. What time would you like to start?',
        suggest: 'Based on your recent activity, I suggest focusing on these tasks: [Task suggestions would appear here]',
        tips: 'Here are some productivity tips: 1. Break tasks into smaller chunks 2. Use the Pomodoro technique 3. Take regular breaks'
    };
    
    addMessageToChat(messages[action], 'ai');
}

// Rewards Management
async function updateRewards() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    try {
        // Get user's points and achievements
        const userPoints = await calculateUserPoints(currentUser.id);
        const achievements = await getUserAchievements(currentUser.id);
        
        // Update points display
        document.querySelector('.points-number').textContent = userPoints.toLocaleString();
        
        // Update achievements
        updateAchievementsDisplay(achievements);
        
        // Update available rewards
        updateAvailableRewards(userPoints);
    } catch (error) {
        console.error('Error updating rewards:', error);
    }
}

async function calculateUserPoints(userId) {
    // Get user's tasks
    const tasks = await database.getUserTasks(userId);
    
    // Calculate points (10 points per completed task)
    const completedTasks = tasks.filter(task => task.status === 'completed');
    return completedTasks.length * 10;
}

async function getUserAchievements(userId) {
    const tasks = await database.getUserTasks(userId);
    const completedTasks = tasks.filter(task => task.status === 'completed');
    
    return {
        taskMaster: {
            unlocked: completedTasks.length >= 50,
            progress: Math.min(100, (completedTasks.length / 50) * 100)
        },
        speedDemon: {
            unlocked: hasCompletedFiveTasksInOneDay(tasks),
            progress: 100
        },
        perfectWeek: {
            unlocked: hasCompletedAllTasksForWeek(tasks),
            progress: calculateWeeklyProgress(tasks)
        }
    };
}

function hasCompletedFiveTasksInOneDay(tasks) {
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const tasksByDate = {};
    
    completedTasks.forEach(task => {
        const date = new Date(task.completedAt).toDateString();
        tasksByDate[date] = (tasksByDate[date] || 0) + 1;
    });
    
    return Object.values(tasksByDate).some(count => count >= 5);
}

function hasCompletedAllTasksForWeek(tasks) {
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const tasksByDate = {};
    
    completedTasks.forEach(task => {
        const date = new Date(task.completedAt).toDateString();
        tasksByDate[date] = (tasksByDate[date] || 0) + 1;
    });
    
    return Object.keys(tasksByDate).length >= 7;
}

function calculateWeeklyProgress(tasks) {
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const tasksByDate = {};
    
    completedTasks.forEach(task => {
        const date = new Date(task.completedAt).toDateString();
        tasksByDate[date] = (tasksByDate[date] || 0) + 1;
    });
    
    return Math.min(100, (Object.keys(tasksByDate).length / 7) * 100);
}

function updateAchievementsDisplay(achievements) {
    // Update Task Master achievement
    const taskMasterCard = document.querySelector('.achievement-card:nth-child(1)');
    updateAchievementCard(taskMasterCard, achievements.taskMaster, 'Task Master', 'Complete 50 tasks');
    
    // Update Speed Demon achievement
    const speedDemonCard = document.querySelector('.achievement-card:nth-child(2)');
    updateAchievementCard(speedDemonCard, achievements.speedDemon, 'Speed Demon', 'Complete 5 tasks in one day');
    
    // Update Perfect Week achievement
    const perfectWeekCard = document.querySelector('.achievement-card:nth-child(3)');
    updateAchievementCard(perfectWeekCard, achievements.perfectWeek, 'Perfect Week', 'Complete all tasks for 7 days');
}

function updateAchievementCard(card, achievement, title, description) {
    card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
    card.querySelector('h6').textContent = title;
    card.querySelector('p').textContent = description;
    card.querySelector('.progress-bar').style.width = `${achievement.progress}%`;
}

function updateAvailableRewards(userPoints) {
    const rewards = [
        { id: 'premium', points: 500, name: 'Premium Week', description: '1 week of premium features' },
        { id: 'theme', points: 300, name: 'Custom Theme', description: 'Unlock custom app theme' },
        { id: 'avatar', points: 200, name: 'Custom Avatar', description: 'Unlock premium avatars' },
        { id: 'badge', points: 100, name: 'Verified Badge', description: 'Get a verified badge' }
    ];
    
    rewards.forEach(reward => {
        const button = document.querySelector(`[data-reward="${reward.id}"]`);
        if (button) {
            button.disabled = userPoints < reward.points;
            button.textContent = `Redeem (${reward.points} pts)`;
        }
    });
}

// Update rewards when showing the page
document.querySelector('a[onclick="showPage(\'rewardsPage\')"]')?.addEventListener('click', () => {
    updateRewards();
});

// Calendar Management
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const monthDisplay = document.getElementById('currentMonthDisplay');
    if (!calendar || !monthDisplay) return;

    // Update month and year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    monthDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    // Get the last day of previous month
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    
    // Clear calendar
    calendar.innerHTML = '';

    // Add days from previous month
    for (let i = startingDay - 1; i >= 0; i--) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = prevMonthLastDay - i;
        dayDiv.appendChild(dayNumber);
        calendar.appendChild(dayDiv);
    }

    // Add days of current month
    for (let day = 1; day <= totalDays; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        
        // Check if it's today
        if (day === currentDate.getDate() && 
            currentMonth === currentDate.getMonth() && 
            currentYear === currentDate.getFullYear()) {
            dayDiv.classList.add('today');
        }

        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayDiv.appendChild(dayNumber);

        // Add task indicators
        const taskDate = new Date(currentYear, currentMonth, day);
        const tasksForDay = getTasksForDate(taskDate);
        if (tasksForDay.length > 0) {
            dayDiv.classList.add('has-tasks');
            
            // Add task dots
            const taskDots = document.createElement('div');
            taskDots.className = 'task-dots';
            tasksForDay.forEach(task => {
                const dot = document.createElement('span');
                dot.className = `task-dot ${isOverdue(task) ? 'overdue' : ''}`;
                taskDots.appendChild(dot);
            });
            dayDiv.appendChild(taskDots);

            // Add task count
            const taskCount = document.createElement('div');
            taskCount.className = 'task-count';
            taskCount.textContent = `${tasksForDay.length} task${tasksForDay.length > 1 ? 's' : ''}`;
            dayDiv.appendChild(taskCount);
        }

        calendar.appendChild(dayDiv);
    }

    // Add days from next month
    const remainingDays = 42 - (startingDay + totalDays); // 42 = 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = i;
        dayDiv.appendChild(dayNumber);
        calendar.appendChild(dayDiv);
    }

    updateUpcomingTasks();
}

function getTasksForDate(date) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return [];

    const tasks = database.data.tasks.filter(task => {
        if (task.userId !== currentUser.id) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.getDate() === date.getDate() &&
               taskDate.getMonth() === date.getMonth() &&
               taskDate.getFullYear() === date.getFullYear();
    });

    return tasks;
}

function isOverdue(task) {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    return dueDate < today && task.status !== 'completed';
}

function updateUpcomingTasks() {
    const upcomingTasks = document.getElementById('upcomingTasks');
    if (!upcomingTasks) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const tasks = database.data.tasks
        .filter(task => task.userId === currentUser.id && task.status !== 'completed')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    upcomingTasks.innerHTML = tasks.map(task => {
        const dueDate = new Date(task.dueDate);
        const isOverdueTask = isOverdue(task);
        
        return `
            <div class="upcoming-task-item ${isOverdueTask ? 'overdue' : ''}">
                <div class="task-title">${task.title}</div>
                <div class="task-date">
                    <i class="bi bi-calendar-event me-1"></i>
                    Due: ${dueDate.toLocaleDateString()}
                </div>
                <span class="task-priority badge bg-${getPriorityColor(task.priority)}">
                    ${task.priority}
                </span>
            </div>
        `;
    }).join('');
}

function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

// Update calendar when showing the page
document.querySelector('a[onclick="showPage(\'calendarPage\')"]')?.addEventListener('click', () => {
    renderCalendar();
});

// Handle subscription upgrade
async function handleSubscriptionUpgrade() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/api/subscription/upgrade', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            alert('Subscription upgraded successfully!');
            updateUIForPremium();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to upgrade subscription');
        }
    } catch (error) {
        console.error('Subscription upgrade error:', error);
        alert('Failed to upgrade subscription');
    }
}

// Update UI for premium users
function updateUIForPremium() {
    const upgradeButton = document.querySelector('.btn-light');
    if (upgradeButton) {
        upgradeButton.innerHTML = '<i class="fas fa-crown"></i> Premium Active';
        upgradeButton.classList.remove('btn-light');
        upgradeButton.classList.add('btn-warning');
        upgradeButton.disabled = true;
    }
}

// Check subscription status on page load
async function checkSubscriptionStatus() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const user = await response.json();
            if (user.subscriptionType === 'premium') {
                updateUIForPremium();
            }
        }
    } catch (error) {
        console.error('Error checking subscription status:', error);
    }
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', () => {
    checkSubscriptionStatus();
    checkAuth();
    updateTaskList();
}); 