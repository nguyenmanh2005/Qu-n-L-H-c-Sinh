const API_URL = "https://localhost:7019/api/auth";

async function register() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    });

    const result = await response.text();
    alert(result);
}
async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    });

    const result = await response.json();

    if (response.ok) {
        alert("Login success");
        localStorage.setItem("token", result.token);
    } else {
        alert("Login failed");
    }
}