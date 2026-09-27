import { useState } from "react";
import "./CreateAnnouncement.css";

function CreateAnnouncement({ user, onBack }) {

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

 const handleSubmit = async (event) => {
  event.preventDefault();

  if (!title.trim() || !message.trim()) {
    alert("Please enter a title and message.");
    return;
  }

  setLoading(true);

  const token = sessionStorage.getItem("rlearnhub_token");

  if (!token) {
    alert("Your login session has expired. Please log in again.");
    setLoading(false);
    return;
  }

  const announcement = {
    title: title.trim(),
    message: message.trim(),
    author: user?.name || "Admin",
    datePosted: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };

  try {
    const response = await fetch(
      "http://localhost:8080/api/announcements",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(announcement),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server response:", errorText);

      throw new Error(
        `Failed to create announcement. Status: ${response.status}`
      );
    }

    alert("Announcement posted successfully!");

    setTitle("");
    setMessage("");

    onBack();

  } catch (error) {
    console.error("Create announcement error:", error);
    alert("Unable to post announcement.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="create-announcement-page">

      <header className="create-announcement-header">

        <div className="create-announcement-brand">

          <img
            src="/rosemont-hills-logo.png"
            alt="Rosemont Hills Montessori College Logo"
          />

          <div>
            <h1>RLearn Hub</h1>
            <p>Create Announcement</p>
          </div>

        </div>

        <button
          className="back-dashboard-button"
          onClick={onBack}
        >
          ← Back
        </button>

      </header>


      <main className="create-announcement-content">

        <div className="create-announcement-card">

          <div className="create-announcement-title">

            <h2>Create Announcement</h2>

            <p>
              Share important updates with RLearn Hub users.
            </p>

          </div>


          <form onSubmit={handleSubmit}>

            <div className="form-group">

              <label htmlFor="announcement-title">
                Announcement Title
              </label>

              <input
                id="announcement-title"
                type="text"
                placeholder="Enter announcement title"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                }}
              />

            </div>


            <div className="form-group">

              <label htmlFor="announcement-message">
                Message
              </label>

              <textarea
                id="announcement-message"
                placeholder="Write your announcement..."
                rows="7"
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                }}
              />

            </div>


            <div className="announcement-author">

              <span>Posting as:</span>

              <strong>
                {user?.name || "Admin"}
              </strong>

            </div>


            <div className="form-actions">

              <button
                type="button"
                className="cancel-button"
                onClick={onBack}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="post-announcement-button"
                disabled={loading}
              >
                {loading
                  ? "Posting..."
                  : "Post Announcement"}
              </button>

            </div>

          </form>

        </div>

      </main>


      <footer className="create-announcement-footer">
        © 2026 RLearn Hub — Rosemont Hills Montessori College
      </footer>

    </div>
  );
}

export default CreateAnnouncement;