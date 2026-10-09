import { useEffect, useState } from "react";
import "./App.css";

import Courses from "./pages/Courses";
import Dashboard from "./pages/Dashboard";
import Resources from "./pages/Resources";
import UploadResource from "./pages/UploadResource";
import Announcements from "./pages/Announcements";
import CreateAnnouncement from "./pages/CreateAnnouncement";
import AdminDashboard from "./pages/AdminDashboard";

// =========================================================
// CONFIGURATION
// =========================================================

const GATEWAY_API = "http://localhost:8080";

const STORAGE_KEYS = {
user: "rlearnhub_user",
token: "rlearnhub_token",
theme: "rlearnhub_theme",
};

// =========================================================
// SESSION HELPERS
// =========================================================

function clearSession() {
sessionStorage.removeItem(STORAGE_KEYS.user);
sessionStorage.removeItem(STORAGE_KEYS.token);
}

function getSavedUser() {
const savedUser = sessionStorage.getItem(STORAGE_KEYS.user);
const savedToken = sessionStorage.getItem(STORAGE_KEYS.token);

if (!savedUser || !savedToken) {
clearSession();
return null;
}

try {
const parsedUser = JSON.parse(savedUser);


if (!parsedUser || !parsedUser.role) {
  clearSession();
  return null;
}

return {
  ...parsedUser,
  token: savedToken,
};


} catch (error) {
console.error("Failed to restore session:", error);
clearSession();
return null;
}
}

// =========================================================
// API RESPONSE HELPERS
// =========================================================

async function readResponse(response) {
const text = await response.text();

if (!text) {
return {};
}

try {
return JSON.parse(text);
} catch {
return { message: text };
}
}

function getErrorMessage(data, fallback) {
if (typeof data === "string") {
return data;
}

return (
data?.message ||
data?.error ||
data?.detail ||
fallback
);
}

// =========================================================
// APP
// =========================================================

function App() {
const [user, setUser] = useState(getSavedUser);
const [currentPage, setCurrentPage] = useState("dashboard");

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const [showPassword, setShowPassword] = useState(false);
const [isLoggingIn, setIsLoggingIn] = useState(false);

const [darkMode, setDarkMode] = useState(
() => localStorage.getItem(STORAGE_KEYS.theme) === "dark"
);

const userRole = user?.role?.toUpperCase();

// =======================================================
// THEME
// =======================================================

useEffect(() => {
document.body.classList.toggle("dark-mode", darkMode);


localStorage.setItem(
  STORAGE_KEYS.theme,
  darkMode ? "dark" : "light"
);

}, [darkMode]);

// =======================================================
// LOGIN
// =======================================================

async function handleSubmit(event) {
event.preventDefault();


if (isLoggingIn) {
  return;
}

const trimmedEmail = email.trim();

if (!trimmedEmail || !password) {
  alert("Please enter your email and password.");
  return;
}

setIsLoggingIn(true);

try {
  const response = await fetch(
    `${GATEWAY_API}/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: trimmedEmail,
        password,
      }),
    }
  );

  const data = await readResponse(response);

  if (!response.ok) {
    console.error("Login request rejected:", {
      status: response.status,
      response: data,
    });

    alert(
      getErrorMessage(
        data,
        `Login failed (HTTP ${response.status}). Please try again.`
      )
    );

    return;
  }

  // Support responses containing either a user object
  // or user fields at the top level.
  const userData = data?.user ?? data;

  const token =
    data?.token ??
    data?.accessToken ??
    data?.access_token ??
    userData?.token ??
    userData?.accessToken ??
    userData?.access_token;

  const role = data?.role ?? userData?.role;

  if (!token || !role) {
    console.error("Unexpected login response:", {
      hasToken: Boolean(token),
      hasRole: Boolean(role),
      responseFields:
        data && typeof data === "object"
          ? Object.keys(data)
          : [],
    });

    alert(
      "The login response is missing the token or user role. Please check the backend login response."
    );

    return;
  }

  const normalizedUser = {
    ...userData,
    token,
    role,
  };

  sessionStorage.setItem(STORAGE_KEYS.token, token);
  sessionStorage.setItem(
    STORAGE_KEYS.user,
    JSON.stringify(normalizedUser)
  );

  setUser(normalizedUser);
  setCurrentPage("dashboard");

  setEmail("");
  setPassword("");
  setShowPassword(false);
} catch (error) {
  console.error("Login request failed:", error);

  alert(
    "Cannot connect to the API Gateway. Check that port 8080 is running and inspect the browser Network tab."
  );
} finally {
  setIsLoggingIn(false);
}

}

// =======================================================
// LOGOUT
// =======================================================

function handleLogout() {
clearSession();

setUser(null);
setCurrentPage("dashboard");

setEmail("");
setPassword("");
setShowPassword(false);

}

// =======================================================
// FORGOT PASSWORD
// =======================================================

function handleForgotPassword(event) {
event.preventDefault();
alert("Forgot Password will be implemented later.");
}

// =======================================================
// NAVIGATION
// =======================================================

function backToDashboard() {
setCurrentPage("dashboard");
}

// =======================================================
// ADMIN PAGE
// =======================================================

if (user && userRole === "ADMIN") {
return ( <AdminDashboard
     user={user}
     onLogout={handleLogout}
   />
);
}

// =======================================================
// RESOURCES PAGE
// =======================================================

if (user && currentPage === "resources") {
return ( <Resources
     user={user}
     onBackToDashboard={backToDashboard}
   />
);
}

// =======================================================
// COURSES PAGE
// =======================================================

if (user && currentPage === "courses") {
return ( <Courses
     onBackToDashboard={backToDashboard}
   />
);
}

// =======================================================
// ANNOUNCEMENTS PAGE
// =======================================================

if (user && currentPage === "announcements") {
return ( <Announcements
     onBackToDashboard={backToDashboard}
   />
);
}

// =======================================================
// CREATE ANNOUNCEMENT PAGE
// =======================================================

if (user && currentPage === "create-announcement") {
return ( <CreateAnnouncement
     user={user}
     onBack={backToDashboard}
   />
);
}

// =======================================================
// UPLOAD RESOURCE PAGE
// =======================================================

if (user && currentPage === "upload-resource") {
return ( <UploadResource
     user={user}
     onBackToDashboard={backToDashboard}
   />
);
}

// =======================================================
// STUDENT / TEACHER DASHBOARD
// =======================================================

if (user) {
return (
<Dashboard
user={user}
onLogout={handleLogout}
onBrowseResources={() => setCurrentPage("resources")}
onAnnouncements={() => setCurrentPage("announcements")}
onUploadResource={() => setCurrentPage("upload-resource")}
onCreateAnnouncement={() =>
setCurrentPage("create-announcement")
}
/>
);
}

// =======================================================
// LOGIN PAGE
// =======================================================

return ( <div className="page">
<button
type="button"
className="theme-toggle"
onClick={() => setDarkMode((previous) => !previous)}
aria-label={
darkMode ? "Switch to light mode" : "Switch to dark mode"
}
title={
darkMode ? "Switch to light mode" : "Switch to dark mode"
}
>
{darkMode ? ( <svg
         viewBox="0 0 24 24"
         width="20"
         height="20"
         fill="none"
         stroke="currentColor"
         strokeWidth="2"
         strokeLinecap="round"
         strokeLinejoin="round"
         aria-hidden="true"
       > <circle cx="12" cy="12" r="4" /> <path d="M12 2v2M12 20v2M2 12h2M20 12h2" /> <path d="m4.93 4.93 1.41 1.41m11.32 11.32 1.41 1.41" /> <path d="m6.34 17.66-1.41 1.41m14.14-14.14-1.41 1.41" /> </svg>
) : ( <svg
         viewBox="0 0 24 24"
         width="20"
         height="20"
         fill="none"
         stroke="currentColor"
         strokeWidth="2"
         strokeLinecap="round"
         strokeLinejoin="round"
         aria-hidden="true"
       > <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /> </svg>
)} </button>

  <div className="brand">
    <img
      src="/rosemont-hills-logo.png"
      alt="Rosemont Hills Montessori College Logo"
      className="school-logo"
    />

    <h1>RLearn Hub</h1>
    <p>Rosemont Hills Montessori College</p>
    <span>Learning Resource Management System</span>
  </div>

  <div className="login-card">
    <h2>Sign In</h2>

    <p className="welcome">
      Welcome back! Please sign in to continue.
    </p>

    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email Address</label>

      <input
        id="email"
        name="email"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="username"
        required
      />

      <label htmlFor="password">Password</label>

      <div className="password-input-wrapper">
        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        <button
          type="button"
          className="password-toggle"
          onClick={() =>
            setShowPassword((previous) => !previous)
          }
          aria-label={
            showPassword ? "Hide password" : "Show password"
          }
          title={
            showPassword ? "Hide password" : "Show password"
          }
        >
          {showPassword ? (
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 3l18 18" />
              <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
              <path d="M9.88 4.24A9.5 9.5 0 0 1 12 4c5 0 8.5 4 9.5 8a10.7 10.7 0 0 1-2.05 3.67" />
              <path d="M6.61 6.61C4.91 7.74 3.65 9.55 2.5 12c1 4 4.5 8 9.5 8a9.5 9.5 0 0 0 3.41-.63" />
            </svg>
          )}
        </button>
      </div>

      <div className="forgot">
        <a
          href="#forgot-password"
          onClick={handleForgotPassword}
        >
          Forgot password?
        </a>
      </div>

      <button
        type="submit"
        className="login-button"
        disabled={isLoggingIn}
      >
        {isLoggingIn ? "Signing In..." : "Sign In"}
      </button>
    </form>
  </div>

  <footer>
    © 2026 RLearn Hub - Rosemont Hills Montessori College
  </footer>
</div>


);
}

export default App;
