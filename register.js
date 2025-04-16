document.getElementById('register-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;

    // Simple mockup registration process (replace with real database in production)
    alert(`User ${username} registered successfully!`);
    window.location.href = 'login.html';
});
