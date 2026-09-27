import { useEffect, useState } from "react";
import "./Announcements.css";

function Announcements({ onBackToDashboard }) {

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchAnnouncements = async () => {
    const token = sessionStorage.getItem("rlearnhub_token");

    if (!token) {
      console.error("Authentication token is missing.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8080/api/announcements",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load announcements. Status: ${response.status}`
        );
      }

      const data = await response.json();

      setAnnouncements(data);
    } catch (error) {
      console.error("Announcement error:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchAnnouncements();
}, []);

  return (
    <div className="announcements-page">

      <header className="announcements-header">

        <div className="announcements-brand">

          <img
            src="/rosemont-hills-logo.png"
            alt="Rosemont Hills Montessori College Logo"
          />

          <div>
            <h1>RLearn Hub</h1>
            <p>Announcements</p>
          </div>

        </div>

        <button
          className="back-dashboard-button"
          onClick={onBackToDashboard}
        >
          ← Dashboard
        </button>

      </header>


      <main className="announcements-content">

        <div className="announcements-title">

          <div>
            <h2>Announcements</h2>

            <p>
              Important updates and information from RLearn Hub.
            </p>
          </div>

        </div>


        {loading ? (

          <div className="announcement-message">
            Loading announcements...
          </div>

        ) : announcements.length === 0 ? (

          <div className="announcement-message">
            No announcements available.
          </div>

        ) : (

          <div className="announcement-list">

            {announcements.map((announcement) => (

              <article
                className="announcement-card"
                key={announcement.id}
              >

                <div className="announcement-card-icon">
                  !
                </div>

                <div className="announcement-card-content">

                  <h3>
                    {announcement.title}
                  </h3>

                  <p>
                    {announcement.message}
                  </p>

                  <div className="announcement-meta">

                    <span>
                      Posted by {announcement.author}
                    </span>

                    <span>
                      {announcement.datePosted}
                    </span>

                  </div>

                </div>

              </article>

            ))}

          </div>

        )}

      </main>


      <footer className="announcements-footer">

        © 2026 RLearn Hub — Rosemont Hills Montessori College

      </footer>

    </div>
  );
}

export default Announcements;