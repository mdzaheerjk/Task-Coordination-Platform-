class Database {
    constructor() {
        this.data = null;
        this.loadData();
    }

    async loadData() {
        try {
            const response = await fetch('/data/database.json');
            this.data = await response.json();
        } catch (error) {
            console.error('Error loading database:', error);
            this.data = {
                users: [],
                tasks: [],
                analytics: {
                    dailyTaskCompletion: {},
                    projectStats: {},
                    productivityTrends: {}
                },
                projects: []
            };
        }
    }

    // User operations
    async findUserByEmail(email) {
        await this.ensureDataLoaded();
        return this.data.users.find(user => user.email === email);
    }

    async addUser(userData) {
        await this.ensureDataLoaded();
        
        // Check if email already exists
        if (await this.findUserByEmail(userData.email)) {
            throw new Error('Email already registered');
        }

        const user = {
            id: `user${this.data.users.length + 1}`,
            ...userData,
            loginHistory: [],
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        this.data.users.push(user);
        await this.saveData();
        return user;
    }

    async recordLogin(userId) {
        await this.ensureDataLoaded();
        const user = this.data.users.find(u => u.id === userId);
        if (user) {
            const loginRecord = {
                date: new Date().toISOString(),
                ip: '127.0.0.1' // In production, get actual IP
            };
            user.loginHistory.push(loginRecord);
            user.lastLogin = loginRecord.date;
            await this.saveData();
        }
    }

    // Task operations
    async getUserTasks(userId) {
        await this.ensureDataLoaded();
        return this.data.tasks.filter(task => task.userId === userId);
    }

    async addTask(taskData) {
        await this.ensureDataLoaded();
        const task = {
            id: `task${this.data.tasks.length + 1}`,
            ...taskData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            completedAt: null
        };
        this.data.tasks.push(task);
        await this.updateAnalytics(task);
        await this.saveData();
        return task;
    }

    async updateTaskStatus(taskId, status) {
        await this.ensureDataLoaded();
        const task = this.data.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = status;
            if (status === 'completed') {
                task.completedAt = new Date().toISOString();
            }
            await this.updateAnalytics(task);
            await this.saveData();
        }
    }

    async deleteTask(taskId) {
        await this.ensureDataLoaded();
        const taskIndex = this.data.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const task = this.data.tasks[taskIndex];
            this.data.tasks.splice(taskIndex, 1);
            await this.updateAnalytics(task);
            await this.saveData();
        }
    }

    // Analytics operations
    async updateAnalytics(task) {
        await this.ensureDataLoaded();
        const userId = task.userId;
        const date = new Date().toISOString().split('T')[0];
        
        // Update daily task completion
        if (!this.data.analytics.dailyTaskCompletion[userId]) {
            this.data.analytics.dailyTaskCompletion[userId] = {};
        }
        if (!this.data.analytics.dailyTaskCompletion[userId][date]) {
            this.data.analytics.dailyTaskCompletion[userId][date] = {
                completed: 0,
                pending: 0,
                total: 0
            };
        }

        const dailyStats = this.data.analytics.dailyTaskCompletion[userId][date];
        if (task.status === 'completed') {
            dailyStats.completed++;
        } else {
            dailyStats.pending++;
        }
        dailyStats.total++;

        // Update project stats
        if (!this.data.analytics.projectStats[userId]) {
            this.data.analytics.projectStats[userId] = {};
        }
        if (!this.data.analytics.projectStats[userId][task.project]) {
            this.data.analytics.projectStats[userId][task.project] = {
                totalTasks: 0,
                completedTasks: 0,
                pendingTasks: 0,
                completionRate: 0
            };
        }

        const projectStats = this.data.analytics.projectStats[userId][task.project];
        projectStats.totalTasks++;
        if (task.status === 'completed') {
            projectStats.completedTasks++;
        } else {
            projectStats.pendingTasks++;
        }
        projectStats.completionRate = (projectStats.completedTasks / projectStats.totalTasks) * 100;

        // Update productivity trends
        this.updateProductivityTrends(userId, task);
    }

    updateProductivityTrends(userId, task) {
        const now = new Date();
        const weekNumber = this.getWeekNumber(now);
        const weekKey = `${now.getFullYear()}-W${weekNumber}`;
        const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'lowercase' });

        if (!this.data.analytics.productivityTrends[userId]) {
            this.data.analytics.productivityTrends[userId] = {
                weekly: {},
                monthly: {}
            };
        }

        // Update weekly trends
        if (!this.data.analytics.productivityTrends[userId].weekly[weekKey]) {
            this.data.analytics.productivityTrends[userId].weekly[weekKey] = {
                monday: 0, tuesday: 0, wednesday: 0, thursday: 0,
                friday: 0, saturday: 0, sunday: 0
            };
        }
        this.data.analytics.productivityTrends[userId].weekly[weekKey][dayOfWeek]++;

        // Update monthly trends
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (!this.data.analytics.productivityTrends[userId].monthly[monthKey]) {
            this.data.analytics.productivityTrends[userId].monthly[monthKey] = {
                week1: 0, week2: 0, week3: 0, week4: 0
            };
        }
        const weekInMonth = Math.ceil(now.getDate() / 7);
        this.data.analytics.productivityTrends[userId].monthly[monthKey][`week${weekInMonth}`]++;
    }

    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    // Data persistence
    async saveData() {
        try {
            const response = await fetch('/data/database.json', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.data, null, 2)
            });
            if (!response.ok) {
                throw new Error('Failed to save data');
            }
        } catch (error) {
            console.error('Error saving database:', error);
        }
    }

    // Get analytics data for dashboard
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

        // Get project statistics
        const projectStats = this.data.analytics.projectStats[userId] || {};

        return {
            totalProjects: projects.length,
            totalTasks: userTasks.length,
            completed,
            pending,
            weeklyProductivity: Object.values(weeklyData),
            projectStats: Object.entries(projectStats).map(([name, stats]) => ({
                name,
                ...stats
            }))
        };
    }

    async ensureDataLoaded() {
        if (!this.data) {
            await this.loadData();
        }
    }
}

// Create and export a singleton instance
const database = new Database();
export default database; 