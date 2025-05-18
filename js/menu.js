document.addEventListener('DOMContentLoaded', function() {
    // Update active menu item
    function updateActiveMenu() {
        const currentPage = window.location.hash.slice(1) || 'home';
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${currentPage}`) {
                item.classList.add('active');
            }
        });
    }

    // Enhanced menu with 3D hover effects
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('mouseenter', (e) => {
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            e.target.style.transform = `
                perspective(1000px)
                rotateX(${(y - rect.height/2)/20}deg)
                rotateY(${-(x - rect.width/2)/20}deg)
                scale(1.05)
            `;
        });

        item.addEventListener('mouseleave', (e) => {
            e.target.style.transform = '';
        });
    });

    // Animated notification badges
    function updateNotificationBadges() {
        const badges = {
            tasks: Math.floor(Math.random() * 5),
            messages: Math.floor(Math.random() * 3),
            rewards: Math.floor(Math.random() * 2)
        };

        Object.entries(badges).forEach(([type, count]) => {
            const badge = document.querySelector(`.menu-badge[data-type="${type}"]`);
            if (badge) {
                if (count > 0) {
                    badge.textContent = count;
                    badge.style.display = 'block';
                    badge.style.animation = 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                } else {
                    badge.style.display = 'none';
                }
            }
        });
    }

    // Initialize menu
    updateActiveMenu();
    updateNotificationBadges();
    window.addEventListener('hashchange', updateActiveMenu);

    // Glassmorphism effect on scroll
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.8)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.background = 'transparent';
            navbar.style.backdropFilter = 'none';
        }
    });
}); 