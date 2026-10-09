import { useEffect, useState } from "react";
import "./Announcements.css";

const API_URL = "http://localhost:8080";
const SCHOOL_LOGO = "/rosemont-hills-logo.png";

/* =========================================================
   GET JWT TOKEN
========================================================= */

const getToken = () => {
  const sessionToken =
    sessionStorage.getItem("rlearnhub_token");

  const localToken =
    localStorage.getItem("rlearnhub_token");

  return sessionToken || localToken;
};

/* =========================================================
   GET CURRENT USER
========================================================= */

const getCurrentUser = () => {
  const sessionUser =
    sessionStorage.getItem("rlearnhub_user");

  const localUser =
    localStorage.getItem("rlearnhub_user");

  const savedUser = sessionUser || localUser;

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch (error) {
    console.error(
      "Could not read saved user:",
      error
    );

    return null;
  }
};

/* =========================================================
   GET ANNOUNCEMENT DATE
========================================================= */

const getAnnouncementDate = (announcement) => {
  return (
    announcement?.datePosted ||
    announcement?.date ||
    announcement?.dateCreated ||
    announcement?.createdAt ||
    null
  );
};

/* =========================================================
   FORMAT DATE
========================================================= */

const formatDate = (value) => {
  if (!value) {
    return "Date not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/* =========================================================
   CREATE UNIQUE ANNOUNCEMENT KEY
========================================================= */

const getAnnouncementKey = (announcement, index) => {
  if (announcement?.id !== undefined && announcement?.id !== null) {
    return `id-${announcement.id}`;
  }

  return `announcement-${announcement?.title || "untitled"}-${index}`;
};

/* =========================================================
   COMPONENT
========================================================= */

function Announcements({ onBackToDashboard }) {
  const [announcements, setAnnouncements] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * Stores the announcement that is currently
   * opened by the user.
   */
  const [expandedAnnouncement, setExpandedAnnouncement] =
    useState(null);

  /*
   * Stores announcement IDs/keys that have
   * already been read.
   */
  const [readAnnouncements, setReadAnnouncements] =
    useState(() => {
      /*
       * Initialize read status from localStorage once when
       * the component mounts. This avoids setting state
       * synchronously inside an effect.
       */
      const currentUser = getCurrentUser();
      const userIdentifier = currentUser?.email || "guest";
      const storageKey =
        `rlearnhub_read_announcements_${userIdentifier}`;

      try {
        const savedReadAnnouncements =
          localStorage.getItem(storageKey);

        if (savedReadAnnouncements) {
          const parsed = JSON.parse(savedReadAnnouncements);
          return Array.isArray(parsed) ? parsed : [];
        }
      } catch (error) {
        console.error(
          "Could not load announcement read status:",
          error
        );
      }

      return [];
    });

  /* =======================================================
     SAVE READ ANNOUNCEMENTS
  ======================================================= */

  const saveReadAnnouncements = (
    updatedReadAnnouncements
  ) => {
    const currentUser = getCurrentUser();

    const userIdentifier =
      currentUser?.email || "guest";

    const storageKey =
      `rlearnhub_read_announcements_${userIdentifier}`;

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(
          updatedReadAnnouncements
        )
      );
    } catch (error) {
      console.error(
        "Could not save announcement read status:",
        error
      );
    }
  };

  /* =======================================================
     MARK ANNOUNCEMENT AS READ
  ======================================================= */

  const markAsRead = (announcementKey) => {
    setReadAnnouncements((currentRead) => {
      if (currentRead.includes(announcementKey)) {
        return currentRead;
      }

      const updatedRead = [
        ...currentRead,
        announcementKey,
      ];

      saveReadAnnouncements(updatedRead);

      return updatedRead;
    });
  };

  /* =======================================================
     CLICK ANNOUNCEMENT
  ======================================================= */

  const handleAnnouncementClick = (
    announcementKey
  ) => {
    /*
     * If the same announcement is clicked again,
     * close it.
     */
    if (
      expandedAnnouncement === announcementKey
    ) {
      setExpandedAnnouncement(null);
      return;
    }

    /*
     * Open the announcement.
     */
    setExpandedAnnouncement(
      announcementKey
    );

    /*
     * Opening the announcement means the user
     * has read it.
     */
    markAsRead(announcementKey);
  };

  /* =======================================================
     FETCH ANNOUNCEMENTS
  ======================================================= */

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const token = getToken();

      if (!token) {
        console.error(
          "Authentication token is missing."
        );

        setError(
          "Your session has expired. Please log in again."
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/announcements`,
          {
            method: "GET",

            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load announcements. Status: ${response.status}`
          );
        }

        const data =
          await response.json();

        /*
         * Make sure the response is an array.
         */
        const announcementData =
          Array.isArray(data)
            ? data
            : [];

        /*
         * =================================================
         * SORT NEWEST → OLDEST
         * =================================================
         */

        const sortedAnnouncements =
          [...announcementData].sort(
            (a, b) => {
              const dateA =
                new Date(
                  getAnnouncementDate(a) || 0
                ).getTime();

              const dateB =
                new Date(
                  getAnnouncementDate(b) || 0
                ).getTime();

              return dateB - dateA;
            }
          );

        setAnnouncements(
          sortedAnnouncements
        );
      } catch (error) {
        console.error(
          "Announcement error:",
          error
        );

        setError(
          error?.message ||
            "Unable to load announcements."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  /* =======================================================
     COUNT UNREAD ANNOUNCEMENTS
  ======================================================= */

  const unreadCount =
    announcements.filter(
      (announcement, index) => {
        const key =
          getAnnouncementKey(
            announcement,
            index
          );

        return !readAnnouncements.includes(key);
      }
    ).length;

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="announcements-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="announcements-header">

        <div className="announcements-brand">

          <img
            src={SCHOOL_LOGO}
            alt="Rosemont Hills Montessori College Logo"
            className="announcements-logo"
          />

          <div className="announcements-brand-text">

            <h1>
              RLearn Hub
            </h1>

            <p>
              Announcements
            </p>

          </div>

        </div>

        <button
          type="button"
          className="back-dashboard-button"
          onClick={onBackToDashboard}
        >
          ← Back to Dashboard
        </button>

      </header>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="announcements-content">

        {/* =================================================
            PAGE TITLE
        ================================================= */}

        <div className="announcements-title">

          <div>

            <span className="announcements-label">
              RLEARN HUB
            </span>

            <h2>
              Announcements
            </h2>

            <p>
              Important updates and information
              from RLearn Hub.
            </p>

          </div>

          {/* UNREAD COUNT */}

          {!loading &&
            !error &&
            unreadCount > 0 && (
              <div className="unread-count">
                <span className="unread-count-number">
                  {unreadCount}
                </span>

                <span>
                  {unreadCount === 1
                    ? "Unread announcement"
                    : "Unread announcements"}
                </span>
              </div>
            )}

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="announcement-message">

            <div className="announcement-loading-icon">
              ...
            </div>

            <p>
              Loading announcements...
            </p>

          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {!loading && error && (
          <div className="announcement-message announcement-error">

            <h3>
              Unable to Load Announcements
            </h3>

            <p>
              {error}
            </p>

          </div>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          !error &&
          announcements.length === 0 && (
            <div className="announcement-message">
              <h3>
                No Announcements
              </h3>

              <p>
                There are currently no announcements
                available.
              </p>

            </div>
          )}

        {/* =================================================
            ANNOUNCEMENT LIST
        ================================================= */}

        {!loading &&
          !error &&
          announcements.length > 0 && (

            <div className="announcement-list">

              {announcements.map(
                (announcement, index) => {

                  const announcementDate =
                    getAnnouncementDate(
                      announcement
                    );

                  const announcementKey =
                    getAnnouncementKey(
                      announcement,
                      index
                    );

                  const isRead =
                    readAnnouncements.includes(
                      announcementKey
                    );

                  const isLatest =
                    index === 0;

                  const isExpanded =
                    expandedAnnouncement ===
                    announcementKey;

                  const isUnread =
                    !isRead;

                  return (
                    <article
                      className={`
                        announcement-card
                        ${isLatest ? "latest-announcement" : ""}
                        ${isUnread ? "unread-announcement" : ""}
                        ${isRead ? "read-announcement" : ""}
                        ${isExpanded ? "expanded-announcement" : ""}
                      `}
                      key={announcementKey}
                      onClick={() =>
                        handleAnnouncementClick(
                          announcementKey
                        )
                      }
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();

                          handleAnnouncementClick(
                            announcementKey
                          );
                        }
                      }}
                    >
                      {/* =================================
                          CONTENT
                      ================================= */}
                      <div className="announcement-card-content">
                        {/* =================================
                            TITLE
                        ================================= */}
                        <div className="announcement-title-row">
                          <h3>
                            {announcement.title ||
                              "Untitled Announcement"}
                          </h3>

                          <span className="announcement-expand-icon">
                            {isExpanded
                              ? "▲"
                              : "▼"}
                          </span>

                        </div>

                        {/* =================================
                            MESSAGE
                        ================================= */}

                        <div
                          className={`announcement-message-content ${
                            isExpanded
                              ? "announcement-message-expanded"
                              : "announcement-message-collapsed"
                          }`}
                        >
                          <p>
                            {announcement.message ||
                              "No announcement message available."}
                          </p>
                        </div>

                        {/* =================================
                            META
                        ================================= */}

                        <div className="announcement-meta">

                          <span>
                            Posted by{" "}
                            {announcement.author ||
                              "Administrator"}
                          </span>

                          <span>
                            {formatDate(
                              announcementDate
                            )}
                          </span>

                        </div>

                        {/* =================================
                            CLICK TO READ
                        ================================= */}

                        {!isRead && (
                          <div className="announcement-read-hint">
                            Click to read this announcement
                          </div>
                        )}

                        {isRead &&
                          !isExpanded && (
                            <div className="announcement-read-hint read">
                              Click to view announcement
                            </div>
                          )}

                      </div>

                    </article>
                  );
                }
              )}

            </div>
          )}

      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="announcements-footer">

        © 2026 RLearn Hub —
        Rosemont Hills Montessori College

      </footer>

    </div>
  );
}

export default Announcements;
