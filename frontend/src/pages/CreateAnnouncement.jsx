import { useState } from "react";
import "./CreateAnnouncement.css";

const API_URL = "http://localhost:8080";
const SCHOOL_LOGO = "/rosemont-hills-logo.png";

/* =========================================================
   GET JWT TOKEN
   Session storage is checked first.
========================================================= */
const getToken = () => {
  const sessionToken =
    sessionStorage.getItem("rlearnhub_token");

  const localToken =
    localStorage.getItem("rlearnhub_token");

  return sessionToken || localToken;
};

/* =========================================================
   CREATE ANNOUNCEMENT
========================================================= */
function CreateAnnouncement({ user, onBack }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    /* -----------------------------------------------------
       VALIDATE FORM
    ----------------------------------------------------- */
    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();

    if (!trimmedTitle || !trimmedMessage) {
      alert("Please enter a title and message.");
      return;
    }

    /* -----------------------------------------------------
       GET TOKEN
    ----------------------------------------------------- */
    const token = getToken();

    if (!token) {
      alert(
        "Your login session has expired. Please log in again."
      );
      return;
    }

    setLoading(true);

    /* -----------------------------------------------------
       ANNOUNCEMENT DATA
       Use ISO date so Spring Boot/PostgreSQL can correctly
       process the date.
    ----------------------------------------------------- */
    const announcement = {
      title: trimmedTitle,
      message: trimmedMessage,
      author: user?.name || "Administrator",
      datePosted: new Date().toISOString(),
    };

    console.log(
      "Creating announcement:",
      announcement
    );

    try {
      /* ---------------------------------------------------
         SEND REQUEST THROUGH API GATEWAY
      --------------------------------------------------- */
      const response = await fetch(
        `${API_URL}/api/announcements`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(announcement),
        }
      );

      /* ---------------------------------------------------
         READ SERVER RESPONSE
      --------------------------------------------------- */
      const responseText = await response.text();

      console.log(
        "Announcement response:",
        response.status,
        responseText
      );

      if (!response.ok) {
        throw new Error(
          `Failed to create announcement. Status: ${response.status}`
        );
      }

      /* ---------------------------------------------------
         SUCCESS
      --------------------------------------------------- */
      alert("Announcement posted successfully!");

      setTitle("");
      setMessage("");

      /* Return to previous page */
      if (typeof onBack === "function") {
        onBack();
      }
    } catch (error) {
      console.error(
        "Create announcement error:",
        error
      );

      alert(
        error?.message ||
          "Unable to post announcement. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-announcement-page">

      {/* ===================================================
          HEADER
      =================================================== */}
      <header className="create-announcement-header">

        <div className="create-announcement-brand">

          <img
            src={SCHOOL_LOGO}
            alt="Rosemont Hills Montessori College Logo"
            className="create-announcement-logo"
          />

          <div className="create-announcement-brand-text">
            <h1>RLearn Hub</h1>
            <p>Create Announcement</p>
          </div>

        </div>

        <button
          type="button"
          className="back-dashboard-button"
          onClick={onBack}
          disabled={loading}
        >
          ← Back to Dashboard
        </button>

      </header>


      {/* ===================================================
          MAIN CONTENT
      =================================================== */}
      <main className="create-announcement-content">

        <div className="create-announcement-card">

          {/* TITLE */}
          <div className="create-announcement-title">

            <span className="create-announcement-label">
              RLEARN HUB
            </span>

            <h2>Create Announcement</h2>

            <p>
              Share important updates with RLearn Hub users.
            </p>

          </div>


          {/* =================================================
              FORM
          ================================================= */}
          <form onSubmit={handleSubmit}>

            {/* ANNOUNCEMENT TITLE */}
            <div className="form-group">

              <label htmlFor="announcement-title">
                Announcement Title
              </label>

              <input
                id="announcement-title"
                name="title"
                type="text"
                placeholder="Enter announcement title"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                maxLength={150}
                disabled={loading}
                required
              />

              <small className="input-helper">
                {title.length}/150 characters
              </small>

            </div>


            {/* MESSAGE */}
            <div className="form-group">

              <label htmlFor="announcement-message">
                Message
              </label>

              <textarea
                id="announcement-message"
                name="message"
                placeholder="Write your announcement..."
                rows={7}
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                maxLength={2000}
                disabled={loading}
                required
              />

              <small className="input-helper">
                {message.length}/2000 characters
              </small>

            </div>


            {/* AUTHOR */}
            <div className="announcement-author">

              <span>Posting as:</span>

              <strong>
                {user?.name || "Administrator"}
              </strong>

            </div>


            {/* FORM ACTIONS */}
            <div className="form-actions">

              <button
                type="button"
                className="cancel-button"
                onClick={onBack}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="post-announcement-button"
                disabled={
                  loading ||
                  !title.trim() ||
                  !message.trim()
                }
              >
                {loading ? (
                  <>
                    <span className="button-spinner">
                      ⟳
                    </span>
                    Posting...
                  </>
                ) : (
                  "Post Announcement"
                )}
              </button>

            </div>

          </form>

        </div>

      </main>


      {/* ===================================================
          FOOTER
      =================================================== */}
      <footer className="create-announcement-footer">
        © 2026 RLearn Hub — Rosemont Hills Montessori College
      </footer>

    </div>
  );
}

export default CreateAnnouncement;
