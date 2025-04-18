document.getElementById('register-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    const storedUsers = JSON.parse(localStorage.getItem('users')) || [];

    const userExists = storedUsers.some(u => u.username === username);
    if (userExists) {
        alert('Username already exists. Please choose a different one.');
        return;
    }

    storedUsers.push({ username, password });
    localStorage.setItem('users', JSON.stringify(storedUsers));
    alert('Registration successful! You can now log in.');

    // Optionally log them in immediately:
    localStorage.setItem('loggedInUser', username);
    window.location.href = 'index.html'; // Redirect to main app
});
