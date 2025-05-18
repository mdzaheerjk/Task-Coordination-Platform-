// Database Configuration
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const db = new sqlite3.Database(path.join(__dirname, '../data/taskmanager.db'), (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        points INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        subscription_type TEXT,
        subscription_end_date DATETIME,
        daily_ai_queries INTEGER DEFAULT 0,
        daily_ai_reset_date DATE,
        theme TEXT,
        timezone TEXT
    )`);

    // Projects table
    db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Tasks table
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        project_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'overdue')),
        due_date DATE,
        reminder_time DATETIME,
        ai_assistance INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        points INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(id)
    )`);

    // Activity log table
    db.run(`CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        activity_type TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Achievements table
    db.run(`CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        points INTEGER DEFAULT 0,
        unlocked_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Rewards table
    db.run(`CREATE TABLE IF NOT EXISTS rewards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        points_required INTEGER NOT NULL,
        redeemed_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Calendar reminders table
    db.run(`CREATE TABLE IF NOT EXISTS calendar_reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        task_id INTEGER NOT NULL,
        reminder_time DATETIME NOT NULL,
        reminder_type TEXT CHECK(reminder_type IN ('notification', 'email', 'sms')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (task_id) REFERENCES tasks(id)
    )`);

    // AI assistance history table
    db.run(`CREATE TABLE IF NOT EXISTS ai_assistance_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        task_id INTEGER NOT NULL,
        query TEXT NOT NULL,
        response TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (task_id) REFERENCES tasks(id)
    )`);
}

// User-related functions
const userDB = {
    // Create new user
    createUser: async ({ fullName, email, password }) => {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO users (full_name, email, password, created_at)
                VALUES (?, ?, ?, datetime('now'))
            `;
            db.run(sql, [fullName, email, password], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },

    // Get user by email
    getUserByEmail: async (email) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE email = ?';
            db.get(sql, [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    // Get user by ID
    getUserById: async (userId) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE id = ?';
            db.get(sql, [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    // Update user points
    updateUserPoints: async (userId, points) => {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE users SET points = points + ? WHERE id = ?';
            db.run(sql, [points, userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    // Update user streak
    updateUserStreak: async (userId, streak) => {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE users SET streak = ? WHERE id = ?';
            db.run(sql, [streak, userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    // Update user subscription
    updateSubscription: async (userId, type, endDate) => {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE users SET subscription_type = ?, subscription_end_date = ? WHERE id = ?';
            db.run(sql, [type, endDate, userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    incrementDailyAIQueries: async (userId) => {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE users SET daily_ai_queries = daily_ai_queries + 1 WHERE id = ?';
            db.run(sql, [userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    resetDailyAIQueries: async (userId) => {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE users SET daily_ai_queries = 0, daily_ai_reset_date = CURRENT_DATE WHERE id = ?';
            db.run(sql, [userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    updateTheme: async (userId, theme) => {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE users SET theme = ? WHERE id = ?';
            db.run(sql, [theme, userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    updateTimezone: async (userId, timezone) => {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE users SET timezone = ? WHERE id = ?';
            db.run(sql, [timezone, userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
};

// Task-related functions
const taskDB = {
    // Create new task
    createTask: async ({ userId, projectId, title, description, priority, dueDate, reminderTime, aiAssistance }) => {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO tasks (
                    user_id, project_id, title, description, priority, 
                    due_date, reminder_time, ai_assistance, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `;
            db.run(sql, [
                userId, projectId, title, description, priority,
                dueDate, reminderTime, aiAssistance ? 1 : 0
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },

    // Get user's tasks
    getUserTasks: async (userId) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT t.*, p.name as project_name
                FROM tasks t
                LEFT JOIN projects p ON t.project_id = p.id
                WHERE t.user_id = ?
                ORDER BY t.due_date ASC
            `;
            db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    // Get user's tasks count
    getUserTasksCount: async (userId, date) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT COUNT(*) as count
                FROM tasks
                WHERE user_id = ? AND date(created_at) = date(?)
            `;
            db.get(sql, [userId, date], (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    },

    // Update task status
    updateTaskStatus: async (taskId, status) => {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE tasks 
                SET status = ?, 
                    completed_at = CASE WHEN ? = 'completed' THEN datetime('now') ELSE NULL END
                WHERE id = ?
            `;
            db.run(sql, [status, status, taskId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    // Get tasks by date
    getTasksByDate: async (userId, date) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM tasks
                WHERE user_id = ? AND date(due_date) = date(?)
                ORDER BY priority DESC, due_date ASC
            `;
            db.all(sql, [userId, date], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    // Create reminder
    createReminder: async (userId, taskId, reminderTime, reminderType = 'notification') => {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO calendar_reminders (
                    user_id, task_id, reminder_time, reminder_type, created_at
                )
                VALUES (?, ?, ?, ?, datetime('now'))
            `;
            db.run(sql, [userId, taskId, reminderTime, reminderType], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },

    // Get user reminders count
    getUserRemindersCount: async (userId, date) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT COUNT(*) as count
                FROM calendar_reminders
                WHERE user_id = ? AND date(created_at) = date(?)
            `;
            db.get(sql, [userId, date], (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    },

    // Get user reminders
    getUserReminders: async (userId) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT r.*, t.title as task_title
                FROM calendar_reminders r
                JOIN tasks t ON r.task_id = t.id
                WHERE r.user_id = ? AND r.status = 'pending'
                ORDER BY r.reminder_time ASC
            `;
            db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    // Log AI assistance
    logAIAssistance: async (userId, taskId, query, response) => {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO ai_assistance_history (
                    user_id, task_id, query, response, created_at
                )
                VALUES (?, ?, ?, ?, datetime('now'))
            `;
            db.run(sql, [userId, taskId, query, response], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },

    // Get AI assistance history
    getAIAssistanceHistory: async (userId, taskId) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM ai_assistance_history
                WHERE user_id = ? AND task_id = ?
                ORDER BY created_at DESC
            `;
            db.all(sql, [userId, taskId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    // Get user analytics
    getUserAnalytics: async (userId, type) => {
        return new Promise((resolve, reject) => {
            let sql;
            if (type === 'daily') {
                sql = `
                    SELECT 
                        date(created_at) as date,
                        COUNT(*) as total_tasks,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                        AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100 as completion_rate
                    FROM tasks
                    WHERE user_id = ? AND created_at >= date('now', '-7 days')
                    GROUP BY date(created_at)
                    ORDER BY date DESC
                `;
            } else {
                sql = `
                    SELECT 
                        strftime('%Y-%W', created_at) as week,
                        COUNT(*) as total_tasks,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                        AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100 as completion_rate
                    FROM tasks
                    WHERE user_id = ? AND created_at >= date('now', '-4 weeks')
                    GROUP BY strftime('%Y-%W', created_at)
                    ORDER BY week DESC
                `;
            }
            db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

// Activity log functions
const activityDB = {
    // Log activity
    logActivity: async (userId, type, description) => {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO activity_log (user_id, activity_type, description, created_at)
                VALUES (?, ?, ?, datetime('now'))
            `;
            db.run(sql, [userId, type, description], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },

    // Get user's recent activities
    getUserActivities: async (userId) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM activity_log
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 50
            `;
            db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

module.exports = {
    db,
    userDB,
    taskDB,
    activityDB
}; 