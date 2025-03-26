const TIMEOUT_DURATION = 10 * 60 * 1000;
let timeoutId;

function checkAuth() {
    if (!localStorage.getItem('token')) {
        window.location.href = '/login.html';
    }
}

function resetTimer() {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(logout, TIMEOUT_DURATION);
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

document.addEventListener('mousemove', resetTimer);
document.addEventListener('keypress', resetTimer);
document.addEventListener('click', resetTimer);
document.addEventListener('scroll', resetTimer);

if (window.location.pathname !== '/login.html') {
    checkAuth();
    resetTimer();
}