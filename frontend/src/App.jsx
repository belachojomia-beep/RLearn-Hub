import { useEffect, useState } from "react";
import "./App.css";

import Courses from "./pages/Courses";
import Dashboard from "./pages/Dashboard";
import Resources from "./pages/Resources";
import UploadResource from "./pages/UploadResource";
import Announcements from "./pages/Announcements";
import CreateAnnouncement from "./pages/CreateAnnouncement";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const [currentPage, setCurrentPage] =
    useState("dashboard");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [user, setUser] =
    useState(null);

  // ==========================================
  // RESTORE LOGIN SESSION
  // ==========================================

  useEffect(() => {
    const savedUser =
      sessionStorage.getItem("rlearnhub_user");

    if (savedUser) {
      try {
        const parsedUser =
          JSON.parse(savedUser);

        setUser(parsedUser);
      } catch (error) {
        console.error(
          "Could not restore login session:",
          error
        );

        sessionStorage.removeItem(
          "rlearnhub_user"
        );

        sessionStorage.removeItem(
          "rlearnhub_token"
        );
      }
    }
  }, []);

  // ==========================================
  // LOGIN
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      alert(
        "Please enter your email and password."
      );
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email: email,
            password: password,
          }),
        }
      );

      if (!response.ok) {
        alert(
          "Invalid email or password."
        );
        return;
      }

            const data = await response.json();

      sessionStorage.setItem(
        "rlearnhub_token",
        data.token
      );

      sessionStorage.setItem(
        "rlearnhub_user",
        JSON.stringify(data)
      );

     setUser(data);

    setEmail("");

    setPassword("");

    setCurrentPage("dashboard");

    } catch (error) {

      console.error(
        "Login error:",
        error
      );

      alert(
        "Cannot connect to the backend."
      );
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {

    // Remove JWT and user information
  sessionStorage.removeItem("rlearnhub_token");
  sessionStorage.removeItem("rlearnhub_user");

    setUser(null);

    setEmail("");

    setPassword("");

    setCurrentPage("dashboard");
  };

  // ==========================================
  // GOOGLE LOGIN
  // ==========================================

  const handleGoogleLogin = () => {

    alert(
      "Google Sign-In will be connected later."
    );
  };

  // ==========================================
  // FORGOT PASSWORD
  // ==========================================

  const handleForgotPassword = (
    event
  ) => {

    event.preventDefault();

    alert(
      "Forgot Password will be implemented later."
    );
  };

  // ==========================================
  // RESOURCE LIBRARY
  // ==========================================

  if (
    user &&
    currentPage === "resources"
  ) {

    return (
      <Resources
        user={user}

        onBackToDashboard={() =>
          setCurrentPage(
            "dashboard"
          )
        }
      />
    );
  }

  // ==========================================
  // COURSES
  // ==========================================

  if (
    user &&
    currentPage === "courses"
  ) {

    return (
      <Courses
        onBackToDashboard={() =>
          setCurrentPage(
            "dashboard"
          )
        }
      />
    );
  }

  // ==========================================
  // ANNOUNCEMENTS
  // ==========================================

  if (
    user &&
    currentPage === "announcements"
  ) {

    return (
      <Announcements
        onBackToDashboard={() =>
          setCurrentPage(
            "dashboard"
          )
        }
      />
    );
  }

  // ==========================================
  // CREATE ANNOUNCEMENT
  // ==========================================

  if (
    user &&
    currentPage ===
      "create-announcement"
  ) {

    return (
      <CreateAnnouncement
        user={user}

        onBack={() =>
          setCurrentPage(
            "dashboard"
          )
        }
      />
    );
  }

  // ==========================================
  // UPLOAD RESOURCE
  // ==========================================

  if (
    user &&
    currentPage ===
      "upload-resource"
  ) {

    return (
      <UploadResource
        onBackToDashboard={() =>
          setCurrentPage(
            "dashboard"
          )
        }
      />
    );
  }

  // ==========================================
// DASHBOARD ROUTING BY ROLE
// ==========================================

if (user) {

  // ADMIN
  if (user.role === "ADMIN") {
    return (
      <AdminDashboard
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  // STUDENT / TEACHER
  return (
    <Dashboard
      user={user}

      onLogout={
        handleLogout
      }

      onBrowseResources={() =>
        setCurrentPage(
          "resources"
        )
      }

      onAnnouncements={() =>
        setCurrentPage(
          "announcements"
        )
      }

      onUploadResource={() =>
        setCurrentPage(
          "upload-resource"
        )
      }

      onCreateAnnouncement={() =>
        setCurrentPage(
          "create-announcement"
        )
      }
    />
  );
}

  // ==========================================
  // LOGIN PAGE
  // ==========================================

  return (
    <div className="page">

      {/* ======================================
          BRAND
      ====================================== */}

      <div className="brand">

        <img
          src="/rosemont-hills-logo.png"
          alt="Rosemont Hills Montessori College Logo"
          className="school-logo"
        />

        <h1>
          RLearn Hub
        </h1>

        <p>
          Rosemont Hills Montessori College
        </p>

        <span>
          Learning Resource Management System
        </span>

      </div>

      {/* ======================================
          LOGIN CARD
      ====================================== */}

      <div className="login-card">

        <h2>
          Sign In
        </h2>

        <p className="welcome">
          Welcome back! Please sign in
          to continue.
        </p>

        {/* ====================================
            LOGIN FORM
        ==================================== */}

        <form
          onSubmit={
            handleSubmit
          }
        >

          <label htmlFor="email">
            Email Address
          </label>

          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
          />

          <label htmlFor="password">
            Password
          </label>

          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
          />

          {/* ==================================
              FORGOT PASSWORD
          ================================== */}

          <div className="forgot">

            <a
              href="#"
              onClick={
                handleForgotPassword
              }
            >
              Forgot password?
            </a>

          </div>

          {/* ==================================
              SIGN IN
          ================================== */}

          <button
            type="submit"
            className="login-button"
          >
            Sign In →
          </button>

        </form>

        {/* ====================================
            DIVIDER
        ==================================== */}

        <div className="divider">

          <span>
            OR
          </span>

        </div>

        {/* ====================================
            GOOGLE
        ==================================== */}

        <button
          type="button"
          className="google-button"
          onClick={
            handleGoogleLogin
          }
        >

          <span className="google-icon">
            G
          </span>

          Continue with Google

        </button>

      </div>

      {/* ======================================
          FOOTER
      ====================================== */}

      <footer>
        © 2026 RLearn Hub -
        Rosemont Hills Montessori College
      </footer>

    </div>
  );
}

export default App;