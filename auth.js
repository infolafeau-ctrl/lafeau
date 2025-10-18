// Authenticatie functionaliteit
const users = {
    'admin': {
        password: 'lafeau2024',
        role: 'superadmin',
        name: 'Hoofd Beheerder'
    },
    'manager': {
        password: 'juwelen123',
        role: 'manager', 
        name: 'Winkel Manager'
    }
};

// Login pagina functionaliteit
if (document.getElementById('loginForm')) {
    document.addEventListener('DOMContentLoaded', function() {
        const loginForm = document.getElementById('loginForm');
        
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    });
}

function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const btnText = document.getElementById('btnText');
    const btnLoading = document.getElementById('btnLoading');
    
    // Reset errors
    hideAllErrors();
    setLoadingState(true);
    
    setTimeout(() => {
        // Validatie
        if (!username) {
            showError('usernameError', 'Gebruikersnaam is verplicht');
            setLoadingState(false);
            return;
        }
        
        if (!password) {
            showError('passwordError', 'Wachtwoord is verplicht');
            setLoadingState(false);
            return;
        }
        
        // Authenticatie
        if (users[username] && users[username].password === password) {
            loginSuccess(username, users[username]);
        } else {
            showError('generalError', 'Ongeldige gebruikersnaam of wachtwoord');
            setLoadingState(false);
        }
    }, 1000);
}

function loginSuccess(username, userData) {
    const loginData = {
        username: username,
        role: userData.role,
        name: userData.name,
        loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('adminAuth', JSON.stringify(loginData));
    localStorage.setItem('adminAuthenticated', 'true');
    
    window.location.href = 'admin.html';
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('show');
    }
}

function hideAllErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => {
        el.classList.remove('show');
    });
}

function setLoadingState(isLoading) {
    const btnText = document.getElementById('btnText');
    const btnLoading = document.getElementById('btnLoading');
    
    if (btnText && btnLoading) {
        if (isLoading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
        } else {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }
}

// Auth check voor admin pagina's
function checkAuth() {
    return localStorage.getItem('adminAuthenticated') === 'true';
}

// Logout functie
function logout() {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminAuthenticated');
    window.location.href = 'login.html';
}

// Toon gebruiker info in admin panel
function displayUserInfo() {
    const authData = localStorage.getItem('adminAuth');
    const userWelcome = document.getElementById('userWelcome');
    
    if (authData && userWelcome) {
        try {
            const user = JSON.parse(authData);
            userWelcome.textContent = `Welkom, ${user.name} (${user.role})`;
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }
}