async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('floatingInput').value;
    const password = document.getElementById('floatingPassword').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('token', data.token);
            window.location.href = '/index.html';
        } else {
            alert('Login failed: ' + data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed');
    }
}

if (localStorage.getItem('token')) {
    window.location.href = 'index.html';
}