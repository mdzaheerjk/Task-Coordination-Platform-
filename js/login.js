function handleLogin(event) {
    event.preventDefault();
    
    // Get form elements
    const form = event.target;
    const button = form.querySelector('button[type="submit"]');
    const buttonText = button.querySelector('.btn-text');
    const spinner = button.querySelector('.loading-spinner');
    
    // Get form values
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Show loading state
    button.disabled = true;
    buttonText.style.display = 'none';
    spinner.style.display = 'block';
    
    // Simulate API call (replace with actual API call)
    setTimeout(() => {
        // Store user data in localStorage
        const userData = {
            email: email,
            name: email.split('@')[0], // For demo purposes
            isLoggedIn: true
        };
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
            <i class="bi bi-check-circle-fill"></i>
            <h4>Login Successful!</h4>
            <p>Redirecting to dashboard...</p>
        `;
        
        form.innerHTML = '';
        form.appendChild(successMessage);
        
        // Redirect to dashboard after delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    }, 1500); // Simulate network delay
} 