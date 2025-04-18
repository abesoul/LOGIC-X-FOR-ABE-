document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    // Dummy localStorage-based login
    const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
    const user = storedUsers.find(u => u.username === username && u.password === password);

    if (user) {
        localStorage.setItem('loggedInUser', username);
        window.location.href = 'index.html'; // Redirect to NeonDAW app
    } else {
        alert('Invalid credentials. Please try again.');
    }
});

