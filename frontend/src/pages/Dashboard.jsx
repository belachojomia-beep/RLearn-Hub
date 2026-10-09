
import { useCallback, useEffect, useState } from "react";
import "./Dashboard.css";

const API_URL = "http://localhost:8080";
const VIEWED_ANNOUNCEMENTS_KEY = "rlearnhub_viewed_announcements_";

// =========================================================
// HELPERS
// =========================================================
function getAuthHeaders() {
  const token =
    sessionStorage.getItem("rlearnhub_token") ||
    localStorage.getItem("rlearnhub_token");

  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getViewedStorageKey(email) {
  return `${VIEWED_ANNOUNCEMENTS_KEY}${email}`;
}

function getViewedAnnouncementIds(email) {
  if (!email) return [];

  try {
    const stored = JSON.parse(
      localStorage.getItem(getViewedStorageKey(email)) || "[]"
    );

    return Array.isArray(stored) ? stored.map(String) : [];
  } catch {
    return [];
  }
}

function getItemTimestamp(item) {
  const value =
    item?.dateAdded ||
    item?.datePosted ||
    item?.date ||
    item?.createdAt ||
    item?.dateCreated;

  if (!value) return 0;

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatDate(value) {
  if (!value) return "No date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Manila",
  });
}

function getResourceType(resource) {
  const value =
    resource?.type ||
    resource?.fileName ||
    resource?.originalFileName ||
    "FILE";

  const parts = String(value).split(".");
  return parts.length > 1
    ? parts.pop().toUpperCase().slice(0, 5)
    : String(value).toUpperCase().slice(0, 5);
}

// =========================================================
// DASHBOARD
// =========================================================
function Dashboard({
  user,
  onLogout,
  onBrowseResources,
  onAnnouncements,
  onUploadResource,
  onCreateAnnouncement,
}) {
  const userRole = String(user?.role || "STUDENT").toUpperCase();
  const isTeacher = userRole === "TEACHER";
  const isAdmin = userRole === "ADMIN";
  const canManage = isTeacher || isAdmin;
  const userEmail = user?.email || "";

  // =======================================================
  // STATISTICS
  // =======================================================
  const [stats, setStats] = useState({
    resources: 0,
    downloads: 0,
    subjects: 0,
  });

  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  // =======================================================
  // RECENT RESOURCES
  // =======================================================
  const [recentResources, setRecentResources] = useState([]);
  const [recentResourcesLoading, setRecentResourcesLoading] =
    useState(true);

  // =======================================================
  // ANNOUNCEMENTS
  // =======================================================
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] =
    useState(true);

  // Initialize viewed IDs without calling setState inside an effect.
  const [viewedState, setViewedState] = useState(() => ({
    email: userEmail,
    ids: getViewedAnnouncementIds(userEmail),
  }));

  // Read the correct user's saved IDs when the active user changes.
  const viewedAnnouncementIds =
    viewedState.email === userEmail
      ? viewedState.ids
      : getViewedAnnouncementIds(userEmail);

  const markAnnouncementAsViewed = useCallback(
    (announcementId) => {
      if (!userEmail || announcementId == null) return;

      const storageKey = getViewedStorageKey(userEmail);
      const savedIds = getViewedAnnouncementIds(userEmail);

      const updatedIds = [
        ...new Set([...savedIds, String(announcementId)]),
      ];

      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedIds));

        setViewedState({
          email: userEmail,
          ids: updatedIds,
        });
      } catch (error) {
        console.error("Unable to save viewed announcement:", error);
      }
    },
    [userEmail]
  );

  // =======================================================
  // LOAD DASHBOARD STATISTICS
  // =======================================================
  const loadDashboardStats = useCallback(async () => {
    if (!userEmail) {
      setStatsLoading(false);
      setStatsError("");
      return;
    }

    setStatsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/dashboard/stats?email=${encodeURIComponent(
          userEmail
        )}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load statistics. Status: ${response.status}`
        );
      }

      const data = await response.json();

      setStats({
        resources: Number(data?.resources ?? 0),
        downloads: Number(data?.downloads ?? 0),
        subjects: Number(data?.subjects ?? 0),
      });

      setStatsError("");
    } catch (error) {
      console.error("Dashboard statistics error:", error);

      setStats({
        resources: 0,
        downloads: 0,
        subjects: 0,
      });

      setStatsError(
        error.message || "Unable to load dashboard statistics."
      );
    } finally {
      setStatsLoading(false);
    }
  }, [userEmail]);

  // =======================================================
  // LOAD RECENT APPROVED RESOURCES
  // =======================================================
  const loadRecentResources = useCallback(async () => {
    setRecentResourcesLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/resources`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to load resources. Status: ${response.status}`
        );
      }

      const data = await response.json();
      const resources = Array.isArray(data) ? data : [];

      const approvedResources = resources.filter(
        (resource) =>
          String(resource?.status || "APPROVED").toUpperCase() ===
          "APPROVED"
      );

      approvedResources.sort((a, b) => {
        const dateDifference =
          getItemTimestamp(b) - getItemTimestamp(a);

        return dateDifference || Number(b?.id || 0) - Number(a?.id || 0);
      });

      setRecentResources(approvedResources.slice(0, 3));
    } catch (error) {
      console.error("Recent resources error:", error);
      setRecentResources([]);
    } finally {
      setRecentResourcesLoading(false);
    }
  }, []);

  // =======================================================
  // LOAD LATEST ANNOUNCEMENTS
  // =======================================================
  const loadAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/announcements`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to load announcements. Status: ${response.status}`
        );
      }

      const data = await response.json();
      const announcementList = Array.isArray(data) ? data : [];

      announcementList.sort((a, b) => {
        const dateDifference =
          getItemTimestamp(b) - getItemTimestamp(a);

        return dateDifference || Number(b?.id || 0) - Number(a?.id || 0);
      });

      setAnnouncements(announcementList.slice(0, 3));
    } catch (error) {
      console.error("Announcements error:", error);
      setAnnouncements([]);
    } finally {
      setAnnouncementsLoading(false);
    }
  }, []);
  // =======================================================
  // LOAD DASHBOARD DATA
  // =======================================================
  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      if (cancelled) return;

      await Promise.all([
        loadRecentResources(),
        loadAnnouncements(),
        ...(userEmail ? [loadDashboardStats()] : []),
      ]);
    };

    const task = Promise.resolve().then(() => {
      if (!cancelled) {
        void loadDashboard();
      }
    });

    return () => {
      cancelled = true;
      void task;
    };
  }, [
    userEmail,
    loadDashboardStats,
    loadRecentResources,
    loadAnnouncements,
  ]);
  const isStatsLoading=statsLoading && Boolean(userEmail);
  // =======================================================
  // PAGE
  // =======================================================
  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <img
            src="/rosemont-hills-logo.png"
            alt="Rosemont Hills Montessori College Logo"
            className="sidebar-logo"
          />

          <div className="brand-text">
            <h1>RLearn Hub</h1>
            <p>Resource Management</p>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="user-details">
            <strong>{user?.name || userEmail || "User"}</strong>
            <span>{userRole}</span>
          </div>
        </div>
        <nav className="dashboard-navigation" aria-label="Main navigation">
          <button
            type="button"
            className="nav-item active"
            aria-current="page"
          >
            <span className="nav-icon">⌂</span>
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={onBrowseResources}
          >
            <span className="nav-icon">▣</span>
            <span>Resource Library</span>
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={onAnnouncements}
          >
            <span className="nav-icon">⚑</span>
            <span>Announcements</span>
          </button>

          {canManage && (
            <>
              <button
                type="button"
                className="nav-item"
                onClick={onUploadResource}
              >
                <span className="nav-icon">↑</span>
                <span>Upload Resource</span>
              </button>

              <button
                type="button"
                className="nav-item"
                onClick={onCreateAnnouncement}
              >
                <span className="nav-icon">+</span>
                <span>Create Announcement</span>
              </button>
            </>
          )}
        </nav>
        <button
          type="button"
          className="dashboard-logout"
          onClick={onLogout}
        >
          <span className="logout-icon">↪</span>
          <span>Logout</span>
        </button>
      </aside>
      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        {/* WELCOME */}
        <section className="dashboard-welcome">
          <div>
            <span className="dashboard-label">
              ROSEMONT HILLS MONTESSORI COLLEGE
            </span>

            <h2>
              Welcome back <span>👋</span>
            </h2>

            <p>{user?.name || "Welcome to RLearn Hub"}</p>
          </div>
        </section>

        {/* STATISTICS */}
        <section className="dashboard-statistics">
          <div className="stat-card">
            <div className="stat-card-top">
              <div className="stat-icon navy-icon">▤</div>
            </div>

            <strong>{isStatsLoading ? "..." : stats.resources}</strong>
            <span>Resources Available</span>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <div className="stat-icon gold-icon">↓</div>
            </div>

            <strong>{isStatsLoading ? "..." : stats.downloads}</strong>
            <span>Downloaded</span>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <div className="stat-icon navy-icon">▦</div>
            </div>

            <strong>{isStatsLoading ? "..." : stats.subjects}</strong>
            <span>Subjects</span>
          </div>
        </section>

        {statsError && (
          <div className="dashboard-error" role="alert">
            {statsError}
          </div>
        )}

        {/* RECENT RESOURCES */}
        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h3>Recently Added Resources</h3>
              <p>
                The 3 newest learning materials available in your library.
              </p>
            </div>

            <button
              type="button"
              className="panel-action"
              onClick={onBrowseResources}
            >
              View All →
            </button>
          </div>

          <div className="resource-list">
            {recentResourcesLoading && (
              <div className="resource-empty-state">
                Loading recent resources...
              </div>
            )}

            {!recentResourcesLoading && recentResources.length === 0 && (
              <div className="resource-empty-state">
                No resources have been added yet.
              </div>
            )}

            {!recentResourcesLoading &&
              recentResources.map((resource) => (
                <div className="resource-row" key={resource.id}>
                  <div className="resource-file-icon">
                    <span>{getResourceType(resource)}</span>
                  </div>

                  <div className="resource-information">
                    <strong>
                      {resource.title || "Untitled Resource"}
                    </strong>

                    <span>
                      {resource.subject || "No subject"}
                      {" · "}
                      {resource.author || "Unknown author"}
                      {" · "}
                      {formatDate(
                        resource.dateAdded ||
                          resource.createdAt ||
                          resource.dateCreated
                      )}
                    </span>
                  </div>

                  <span
                    className={`file-badge ${String(resource.type || "file")
                      .toLowerCase()
                      .replace(/[^a-z0-9_-]/g, "")}`}
                  >
                    {getResourceType(resource)}
                  </span>
                </div>
              ))}
          </div>
        </section>

        {/* ANNOUNCEMENTS */}
        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h3>Latest Announcements</h3>
              <p>The 3 newest announcements from RLearn Hub.</p>
            </div>

            <button
              type="button"
              className="panel-action"
              onClick={onAnnouncements}
            >
              View All →
            </button>
          </div>

          <div className="announcement-list">
            {announcementsLoading && (
              <div className="resource-empty-state">
                Loading announcements...
              </div>
            )}

            {!announcementsLoading && announcements.length === 0 && (
              <div className="resource-empty-state">
                No announcements available.
              </div>
            )}

            {!announcementsLoading &&
              announcements.map((announcement) => {
                const isNew = !viewedAnnouncementIds.includes(
                  String(announcement.id)
                );

                return (
                  <article
                    className={`announcement-row ${
                      isNew ? "announcement-row-latest" : ""
                    }`}
                    key={announcement.id}
                    onClick={() =>
                      markAnnouncementAsViewed(announcement.id)
                    }
                  >
                    <div className="announcement-icon">!</div>

                    <div className="announcement-information">
                      <div className="announcement-title-row">
                        <strong>
                          {announcement.title || "Untitled Announcement"}
                        </strong>

                        {isNew && (
                          <span className="announcement-new-badge">
                            NEW
                          </span>
                        )}
                      </div>

                      <p>
                        {announcement.message ||
                          "No announcement message."}
                      </p>

                      <span>
                        {announcement.author || "Administrator"}
                        {" · "}
                        {formatDate(
                          announcement.datePosted ||
                            announcement.date ||
                            announcement.createdAt ||
                            announcement.dateCreated
                        )}
                      </span>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="dashboard-footer">
          © 2026 RLearn Hub — Rosemont Hills Montessori College
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;