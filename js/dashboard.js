document.addEventListener('DOMContentLoaded', function() {
    // Example: Animate dashboard cards on load
    document.querySelectorAll('.dashboard-3d-card').forEach((card, i) => {
        card.style.opacity = 0;
        setTimeout(() => {
            card.style.opacity = 1;
            card.style.transform = 'translateY(0)';
        }, 200 * i);
    });

    // Example: 3D hover effect (optional, for extra 3D feel)
    document.querySelectorAll('.dashboard-3d-card').forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width/2;
            const y = e.clientY - rect.top - rect.height/2;
            card.style.transform = `rotateY(${x/20}deg) rotateX(${-y/20}deg) scale(1.03)`;
        });
        card.addEventListener('mouseleave', function() {
            card.style.transform = '';
        });
    });

    // 3D Card Effect
    const cards = document.querySelectorAll('.dashboard-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.transform = `
                perspective(1000px)
                rotateX(${(y - rect.height/2)/20}deg)
                rotateY(${-(x - rect.width/2)/20}deg)
                scale(1.02)
            `;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // Animated Statistics
    function animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            element.textContent = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Initialize charts with animations
    function initializeCharts() {
        const ctx = document.getElementById('taskChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Tasks Completed',
                    data: [12, 19, 15, 17, 22, 25, 28],
                    borderColor: '#4a90e2',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(74, 144, 226, 0.1)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Weekly Progress'
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }
});

// Check if user is logged in
function checkAuth() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData || !userData.isLoggedIn) {
        window.location.href = 'login.html';
    }
}

// Call on page load
document.addEventListener('DOMContentLoaded', checkAuth);

function handleLogout() {
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
} 