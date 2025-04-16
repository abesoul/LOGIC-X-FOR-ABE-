document.getElementById('login-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Simple mockup login process (replace with real auth in production)
    if (username === 'user' && password === 'password') {
        window.location.href = 'index.html';
    } else {
        alert('Invalid credentials');
    }
});
