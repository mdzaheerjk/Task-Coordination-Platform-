const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { userDB, taskDB, activityDB } = require('./js/db');

const app = express();
app.use(express.json());

// JWT Secret
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// Plan Limits
const PLAN_LIMITS = {
    free: {
        dailyTasks: 5,
        dailyAIQueries: 5,
        dailyReminders: 3,
        themes: ['default'],
        integrations: false,
        analytics: 'weekly'
    },
    premium: {
        dailyTasks: Infinity,
        dailyAIQueries: Infinity,
        dailyReminders: Infinity,
        themes: ['default', 'dark', 'light', 'colorful', 'minimal'],
        integrations: true,
        analytics: 'daily'
    }
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Middleware to check premium subscription
const checkPremiumSubscription = async (req, res, next) => {
    try {
        const user = await userDB.getUserById(req.user.id);
        if (user.subscription_type !== 'premium' || new Date(user.subscription_end_date) < new Date()) {
            return res.status(403).json({ error: 'Premium subscription required' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Error checking subscription' });
    }
};

// Middleware to check plan limits
const checkPlanLimits = async (req, res, next) => {
    try {
        const user = await userDB.getUserById(req.user.id);
        const planType = user.subscription_type;
        const limits = PLAN_LIMITS[planType];

        // Check daily task limit for free users
        if (planType === 'free') {
            const todayTasks = await taskDB.getUserTasksCount(user.id, new Date());
            if (todayTasks >= limits.dailyTasks) {
                return res.status(403).json({ 
                    error: 'Daily task limit reached',
                    upgradeRequired: true
                });
            }
        }

        // Check daily AI queries for free users
        if (planType === 'free' && req.path.includes('/ai/assist')) {
            if (user.daily_ai_queries >= limits.dailyAIQueries) {
                return res.status(403).json({ 
                    error: 'Daily AI query limit reached',
                    upgradeRequired: true
                });
            }
        }

        // Check daily reminders for free users
        if (planType === 'free' && req.path.includes('/reminders')) {
            const todayReminders = await taskDB.getUserRemindersCount(user.id, new Date());
            if (todayReminders >= limits.dailyReminders) {
                return res.status(403).json({ 
                    error: 'Daily reminder limit reached',
                    upgradeRequired: true
                });
            }
        }

        next();
    } catch (error) {
        res.status(500).json({ error: 'Error checking plan limits' });
    }
};

// Authentication Routes
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // Check if user already exists
        const existingUser = await userDB.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const userId = await userDB.createUser({
            fullName,
            email,
            password: hashedPassword
        });

        // Log activity
        await activityDB.logActivity(userId, 'registration', 'User registered');

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Get user
        const user = await userDB.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Log activity
        await activityDB.logActivity(user.id, 'login', 'User logged in');

        // Get plan limits
        const planLimits = PLAN_LIMITS[user.subscription_type];

        res.json({
            token,
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                points: user.points,
                streak: user.streak,
                subscriptionType: user.subscription_type,
                subscriptionEndDate: user.subscription_end_date,
                planLimits
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Subscription Routes
app.post('/api/subscription/upgrade', authenticateToken, async (req, res) => {
    try {
        const { paymentMethod, duration } = req.body;
        const userId = req.user.id;

        // Process payment (implement your payment gateway integration here)
        // For demo, we'll just update the subscription

        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + duration);

        await userDB.updateSubscription(userId, 'premium', endDate);
        await activityDB.logActivity(userId, 'subscription_upgrade', 'Upgraded to premium subscription');

        res.json({ 
            message: 'Subscription upgraded successfully',
            planLimits: PLAN_LIMITS.premium
        });
    } catch (error) {
        console.error('Subscription upgrade error:', error);
        res.status(500).json({ error: 'Failed to upgrade subscription' });
    }
});

// Payment Routes
app.post('/api/payment/verify', authenticateToken, async (req, res) => {
    try {
        const { transactionId, screenshot } = req.body;
        const userId = req.user.id;

        // Here you would typically verify the payment with your payment provider
        // For now, we'll just update the subscription
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription

        await userDB.updateSubscription(userId, 'premium', endDate);
        await activityDB.logActivity(userId, 'subscription_upgrade', 'Upgraded to premium subscription via payment');

        res.json({ 
            message: 'Payment verified and subscription upgraded successfully',
            planLimits: PLAN_LIMITS.premium
        });
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
});

// Contact Sales Route
app.post('/api/contact-sales', async (req, res) => {
    try {
        const { name, email, company, message } = req.body;
        
        // Here you would typically send an email to your sales team
        // For now, we'll just log the contact request
        console.log('Sales contact request:', { name, email, company, message });
        
        res.json({ message: 'Contact request received. Our sales team will reach out to you shortly.' });
    } catch (error) {
        console.error('Contact sales error:', error);
        res.status(500).json({ error: 'Failed to process contact request' });
    }
});

// Task Routes with Plan Limits
app.post('/api/tasks', authenticateToken, checkPlanLimits, async (req, res) => {
    try {
        const { projectId, title, description, priority, dueDate, reminderTime, aiAssistance } = req.body;
        const userId = req.user.id;

        // Check if AI assistance is requested
        if (aiAssistance) {
            const user = await userDB.getUserById(userId);
            if (user.subscription_type !== 'premium') {
                return res.status(403).json({ error: 'Premium subscription required for AI assistance' });
            }
        }

        const taskId = await taskDB.createTask({
            userId,
            projectId,
            title,
            description,
            priority,
            dueDate,
            reminderTime,
            aiAssistance
        });

        // Create reminder if specified
        if (reminderTime) {
            await taskDB.createReminder(userId, taskId, reminderTime);
        }

        // Log activity
        await activityDB.logActivity(userId, 'task_created', `Created task: ${title}`);

        res.status(201).json({ message: 'Task created successfully', taskId });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// AI Assistance Routes
app.post('/api/ai/assist', authenticateToken, checkPlanLimits, async (req, res) => {
    try {
        const { taskId, query } = req.body;
        const userId = req.user.id;
        const user = await userDB.getUserById(userId);

        // Check AI query limit for free users
        if (user.subscription_type === 'free') {
            if (user.daily_ai_queries >= PLAN_LIMITS.free.dailyAIQueries) {
                return res.status(403).json({ 
                    error: 'Daily AI query limit reached',
                    upgradeRequired: true
                });
            }
            await userDB.incrementDailyAIQueries(userId);
        }

        // Implement your AI assistance logic here
        const aiResponse = {
            suggestions: [
                'Break down the task into smaller subtasks',
                'Set specific deadlines for each subtask',
                'Prioritize based on importance and urgency'
            ],
            resources: [
                'Relevant documentation',
                'Helpful articles',
                'Related templates'
            ]
        };

        // Log AI assistance
        await taskDB.logAIAssistance(userId, taskId, query, JSON.stringify(aiResponse));

        res.json(aiResponse);
    } catch (error) {
        console.error('AI assistance error:', error);
        res.status(500).json({ error: 'Failed to get AI assistance' });
    }
});

// Calendar Reminder Routes
app.post('/api/reminders/:taskId', authenticateToken, checkPlanLimits, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { reminderTime, reminderType } = req.body;
        const userId = req.user.id;
        const user = await userDB.getUserById(userId);

        // Check reminder limit for free users
        if (user.subscription_type === 'free') {
            const todayReminders = await taskDB.getUserRemindersCount(userId, new Date());
            if (todayReminders >= PLAN_LIMITS.free.dailyReminders) {
                return res.status(403).json({ 
                    error: 'Daily reminder limit reached',
                    upgradeRequired: true
                });
            }
        }

        const reminderId = await taskDB.createReminder(userId, taskId, reminderTime, reminderType);
        res.status(201).json({ message: 'Reminder created successfully', reminderId });
    } catch (error) {
        console.error('Create reminder error:', error);
        res.status(500).json({ error: 'Failed to create reminder' });
    }
});

// Theme Routes
app.get('/api/themes', authenticateToken, async (req, res) => {
    try {
        const user = await userDB.getUserById(req.user.id);
        const availableThemes = PLAN_LIMITS[user.subscription_type].themes;
        res.json({ themes: availableThemes });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get themes' });
    }
});

app.post('/api/themes', authenticateToken, checkPremiumSubscription, async (req, res) => {
    try {
        const { theme } = req.body;
        const userId = req.user.id;

        if (!PLAN_LIMITS.premium.themes.includes(theme)) {
            return res.status(400).json({ error: 'Invalid theme' });
        }

        await userDB.updateTheme(userId, theme);
        res.json({ message: 'Theme updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update theme' });
    }
});

// Analytics Routes
app.get('/api/analytics', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userDB.getUserById(userId);
        const analyticsType = PLAN_LIMITS[user.subscription_type].analytics;

        const analytics = await taskDB.getUserAnalytics(userId, analyticsType);
        res.json(analytics);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 