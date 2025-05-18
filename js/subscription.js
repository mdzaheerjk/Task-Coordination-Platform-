document.addEventListener('DOMContentLoaded', function() {
    const plans = [
        { id: 'free', name: 'Free', price: 0, features: ['Basic Task Management', 'Limited Projects', 'Basic Analytics'] },
        { id: 'premium', name: 'Premium', price: 699, features: ['Unlimited Tasks', 'Advanced Analytics', 'AI Assistant', 'Priority Support'] }
    ];

    function renderPlans() {
        const plansContainer = document.getElementById('plansContainer');
        if (!plansContainer) return;

        plansContainer.innerHTML = plans.map(plan => `
            <div class="subscription-card ${plan.id === 'premium' ? 'featured' : ''}">
                <h3>${plan.name}</h3>
                <div class="subscription-price">
                    ₹${plan.price}<small>/6 months</small>
                </div>
                <ul class="subscription-features">
                    ${plan.features.map(feature => `
                        <li>${feature}</li>
                    `).join('')}
                </ul>
                <button class="btn ${plan.id === 'premium' ? 'btn-light' : 'btn-primary'} w-100"
                        onclick="subscribe('${plan.id}')">
                    Subscribe Now
                </button>
            </div>
        `).join('');
    }

    // Plan comparison animation
    function comparePlans() {
        const plans = document.querySelectorAll('.subscription-card');
        plans.forEach(plan => {
            plan.addEventListener('mouseenter', () => {
                plan.style.transform = 'scale(1.05)';
                plan.style.zIndex = '1';
            });

            plan.addEventListener('mouseleave', () => {
                plan.style.transform = '';
                plan.style.zIndex = '0';
            });
        });
    }

    // Feature highlight animation
    function highlightFeature(featureId) {
        const feature = document.querySelector(`[data-feature-id="${featureId}"]`);
        feature.style.backgroundColor = 'rgba(74, 144, 226, 0.1)';
        setTimeout(() => {
            feature.style.backgroundColor = '';
        }, 1000);
    }

    // Subscription process animation
    function subscribe(planId) {
        const button = document.querySelector(`[data-plan-id="${planId}"] button`);
        button.innerHTML = '<div class="spinner-border spinner-border-sm"></div> Processing...';
        button.disabled = true;

        setTimeout(() => {
            button.innerHTML = 'Subscribed!';
            button.classList.add('btn-success');
            showSuccessMessage('Subscription successful!');
        }, 1500);
    }

    // Initialize plans
    renderPlans();
}); 