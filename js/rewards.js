document.addEventListener('DOMContentLoaded', function() {
    const rewards = [
        { id: 1, title: 'Early Bird', points: 100, progress: 75 },
        { id: 2, title: 'Task Master', points: 500, progress: 30 },
        { id: 3, title: 'Team Player', points: 1000, progress: 90 }
    ];

    function renderRewards() {
        const rewardsContainer = document.getElementById('rewardsContainer');
        if (!rewardsContainer) return;

        rewardsContainer.innerHTML = rewards.map(reward => `
            <div class="reward-card">
                <div class="reward-icon">
                    <i class="bi bi-trophy"></i>
                </div>
                <h4>${reward.title}</h4>
                <p>${reward.points} points</p>
                <div class="reward-progress">
                    <div class="reward-progress-bar" style="width: ${reward.progress}%"></div>
                </div>
                <button class="btn btn-primary mt-3" 
                        onclick="claimReward(${reward.id})"
                        ${reward.progress < 100 ? 'disabled' : ''}>
                    Claim Reward
                </button>
            </div>
        `).join('');
    }

    function claimReward(rewardId) {
        const reward = document.querySelector(`[data-reward-id="${rewardId}"]`);
        reward.style.transform = 'scale(0.95)';
        
        // Confetti effect
        const confetti = new JSConfetti();
        confetti.addConfetti({
            emojis: ['🎉', '🎊', '🏆', '⭐'],
            confettiNumber: 100,
        });

        setTimeout(() => {
            reward.style.transform = '';
            showSuccessMessage('Reward claimed successfully!');
        }, 500);
    }

    // Progress bar animation
    function updateProgress(rewardId, progress) {
        const progressBar = document.querySelector(`[data-reward-id="${rewardId}"] .reward-progress-bar`);
        progressBar.style.width = `${progress}%`;
        progressBar.style.transition = 'width 1s ease-in-out';
    }

    // Reward card hover effect
    const rewardCards = document.querySelectorAll('.reward-card');
    rewardCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px) rotateY(5deg)';
            card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.boxShadow = '';
        });
    });

    // Initialize rewards
    renderRewards();
}); 