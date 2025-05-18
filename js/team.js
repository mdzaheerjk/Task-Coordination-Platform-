document.addEventListener('DOMContentLoaded', function() {
    const teamMembers = [
        { name: 'John Doe', role: 'Lead Developer', avatar: 'https://via.placeholder.com/100' },
        { name: 'Jane Smith', role: 'UI/UX Designer', avatar: 'https://via.placeholder.com/100' },
        { name: 'Mike Johnson', role: 'Project Manager', avatar: 'https://via.placeholder.com/100' }
    ];

    function renderTeam() {
        const teamContainer = document.getElementById('teamList');
        if (!teamContainer) return;

        teamContainer.innerHTML = teamMembers.map(member => `
            <div class="col-md-4">
                <div class="team-card">
                    <img src="${member.avatar}" alt="${member.name}" class="team-avatar">
                    <h4>${member.name}</h4>
                    <p class="text-muted">${member.role}</p>
                    <div class="team-social">
                        <a href="#"><i class="bi bi-linkedin"></i></a>
                        <a href="#"><i class="bi bi-twitter"></i></a>
                        <a href="#"><i class="bi bi-github"></i></a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Initialize team
    renderTeam();

    // Team card hover effect
    const teamCards = document.querySelectorAll('.team-card');
    teamCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px) rotateY(5deg)';
            card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            
            const avatar = card.querySelector('.team-avatar');
            avatar.style.transform = 'scale(1.1)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.boxShadow = '';
            
            const avatar = card.querySelector('.team-avatar');
            avatar.style.transform = '';
        });
    });

    // Social media hover effect
    const socialLinks = document.querySelectorAll('.team-social a');
    socialLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            link.style.transform = 'translateY(-3px)';
            link.style.color = '#4a90e2';
        });

        link.addEventListener('mouseleave', () => {
            link.style.transform = '';
            link.style.color = '';
        });
    });
}); 