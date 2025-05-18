document.addEventListener('DOMContentLoaded', function() {
    let currentRating = 0;

    function initializeRatingStars() {
        const stars = document.querySelectorAll('.rating-star');
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                currentRating = index + 1;
                updateStars();
            });
            star.addEventListener('mouseenter', () => {
                highlightStars(index);
            });
        });

        document.querySelector('.rating-stars').addEventListener('mouseleave', () => {
            updateStars();
        });
    }

    function updateStars() {
        const stars = document.querySelectorAll('.rating-star');
        stars.forEach((star, index) => {
            star.style.color = index < currentRating ? '#ffd700' : '#e9ecef';
        });
    }

    function highlightStars(index) {
        const stars = document.querySelectorAll('.rating-star');
        stars.forEach((star, i) => {
            star.style.color = i <= index ? '#ffd700' : '#e9ecef';
        });
    }

    // Star rating animation
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach((star, index) => {
        star.addEventListener('mouseenter', () => {
            stars.forEach((s, i) => {
                s.style.transform = i <= index ? 'scale(1.2)' : '';
                s.style.color = i <= index ? '#ffd700' : '#e9ecef';
            });
        });

        star.addEventListener('mouseleave', () => {
            stars.forEach(s => {
                s.style.transform = '';
                s.style.color = '';
            });
        });
    });

    // Form submission animation
    const form = document.getElementById('feedbackForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        form.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            form.innerHTML = `
                <div class="success-message">
                    <i class="bi bi-check-circle-fill"></i>
                    <h4>Thank you for your feedback!</h4>
                </div>
            `;
            form.style.transform = '';
        }, 300);
    });

    // Initialize feedback
    initializeRatingStars();
}); 