document.addEventListener('DOMContentLoaded', function() {
    const leaderboardData = [
        { rank: 1, name: 'John Doe', points: 1000, completed: 120, streak: '15 days' },
        { rank: 2, name: 'Jane Smith', points: 850, completed: 110, streak: '10 days' },
        { rank: 3, name: 'Mike Johnson', points: 750, completed: 90, streak: '7 days' }
    ];

    function renderLeaderboard() {
        const leaderboardTable = document.getElementById('leaderboardTable');
        if (!leaderboardTable) return;

        leaderboardTable.innerHTML = leaderboardData.map(user => `
            <div class="leaderboard-card">
                <div class="d-flex align-items-center">
                    <div class="rank-badge rank-${user.rank}">${user.rank}</div>
                    <img src="https://via.placeholder.com/50" class="user-avatar" alt="${user.name}">
                    <div class="ms-3">
                        <h5 class="mb-0">${user.name}</h5>
                        <p class="text-muted mb-0">${user.completed} tasks completed</p>
                    </div>
                    <div class="ms-auto text-end">
                        <h4 class="mb-0">${user.points}</h4>
                        <small class="text-muted">${user.streak} streak</small>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Initialize leaderboard
    renderLeaderboard();

    // Animated rank changes
    function updateRank(userId, newRank) {
        const userCard = document.querySelector(`[data-user-id="${userId}"]`);
        const oldRank = userCard.querySelector('.rank-badge').textContent;
        
        userCard.style.transform = 'scale(1.05)';
        setTimeout(() => {
            userCard.style.transform = '';
            userCard.querySelector('.rank-badge').textContent = newRank;
            userCard.querySelector('.rank-badge').classList.add('rank-changed');
        }, 300);
    }

    // Podium animation
    function animatePodium() {
        const podium = document.querySelector('.podium');
        podium.style.transform = 'translateY(0)';
        podium.style.opacity = '1';
    }

    // User card hover effect
    const userCards = document.querySelectorAll('.leaderboard-card');
    userCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.boxShadow = '';
        });
    });
}); 