import { useEffect, useState } from "react";
import "./Dashboard.css";

function Dashboard({
  user,
  onLogout,
  onBrowseResources,
  onAnnouncements,
  onUploadResource,
  onCreateAnnouncement,
}) {
  // ==========================================
  // USER ROLE
  // ==========================================

  const isTeacher =
    user?.role === "TEACHER" ||
    user?.role === "Teacher";

  const isAdmin =
    user?.role === "ADMIN" ||
    user?.role === "Admin";

  const canManage =
    isTeacher || isAdmin;


  // ==========================================
  // JWT AUTHORIZATION
  // ==========================================

  const getAuthHeaders = () => {
    const token =
      sessionStorage.getItem(
        "rlearnhub_token"
      ) || user?.token;

    if (!token) {
      return {};
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };


  // ==========================================
  // DASHBOARD STATISTICS
  // ==========================================

  const [stats, setStats] = useState({
    resources: 0,
    downloads: 0,
    subjects: 0,
  });

  const [statsLoading, setStatsLoading] =
    useState(true);

  const [recentResources, setRecentResources] =
    useState([]);

  const [recentResourcesLoading, setRecentResourcesLoading] =
    useState(true);


  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [notificationLoading, setNotificationLoading] =
    useState(false);


  // ==========================================
  // LOAD DASHBOARD STATISTICS
  // ==========================================

  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true);

      if (!user?.email) {
        setStats({
          resources: 0,
          downloads: 0,
          subjects: 0,
        });

        return;
      }

      const response = await fetch(
        `http://localhost:8080/api/dashboard/stats?email=${encodeURIComponent(
          user.email
        )}`,
        {
          method: "GET",
          headers: {
              Authorization: `Bearer ${sessionStorage.getItem(
        "rlearnhub_token"
            )}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load dashboard statistics."
        );
      }

      const data =
        await response.json();

      setStats({
        resources:
          data.resources ?? 0,

        downloads:
          data.downloads ?? 0,

        subjects:
          data.subjects ?? 0,
      });

    } catch (error) {
      console.error(
        "Dashboard statistics error:",
        error
      );

      setStats({
        resources: 0,
        downloads: 0,
        subjects: 0,
      });

    } finally {
      setStatsLoading(false);
    }
  };


  // ==========================================
  // LOAD RECENT RESOURCES
  // ==========================================

  const loadRecentResources = async () => {
    try {
      setRecentResourcesLoading(true);

      const response = await fetch(
        "http://localhost:8080/api/resources",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem(
        "rlearnhub_token"
            )}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load recent resources."
        );
      }

      const data =
        await response.json();

      const recent = [...data]
        .sort((a, b) => {
          const dateA =
            new Date(a.dateAdded || 0);

          const dateB =
            new Date(b.dateAdded || 0);

          return dateB - dateA;
        })
        .slice(0, 3);

      setRecentResources(recent);

    } catch (error) {
      console.error(
        "Recent resources error:",
        error
      );

      setRecentResources([]);

    } finally {
      setRecentResourcesLoading(false);
    }
  };


  // ==========================================
  // LOAD DASHBOARD DATA
  // ==========================================

  useEffect(() => {
    if (user?.email) {
      loadDashboardStats();
    }

    loadRecentResources();
  }, [user?.email]);


  // ==========================================
  // LOAD NOTIFICATIONS
  // ==========================================

  const loadNotifications = async () => {
    if (!user?.email) {
      return;
    }

    try {
      setNotificationLoading(true);

      const response = await fetch(
        `http://localhost:8080/api/notifications?email=${encodeURIComponent(
          user.email
        )}`,
        {
          method: "GET",
          headers: {
           Authorization: `Bearer ${sessionStorage.getItem(
        "rlearnhub_token"
      )}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load notifications."
        );
      }

      const data =
        await response.json();

      setNotifications(data);

      const unread =
        data.filter(
          (notification) =>
            notification.readStatus === false
        ).length;

      setUnreadCount(unread);

    } catch (error) {
      console.error(
        "Notification loading error:",
        error
      );

    } finally {
      setNotificationLoading(false);
    }
  };


  // ==========================================
  // LOAD NOTIFICATIONS WHEN DASHBOARD OPENS
  // ==========================================

  useEffect(() => {
    loadNotifications();

    const interval =
      setInterval(() => {
        loadNotifications();
      }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [user?.email]);


  // ==========================================
  // MARK ONE NOTIFICATION AS READ
  // ==========================================

  const markNotificationAsRead = async (
    notificationId
  ) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to mark notification as read."
        );
      }

      setNotifications(
        (previousNotifications) =>
          previousNotifications.map(
            (notification) =>
              notification.id ===
              notificationId
                ? {
                    ...notification,
                    readStatus: true,
                  }
                : notification
          )
      );

      setUnreadCount(
        (previousCount) =>
          Math.max(
            previousCount - 1,
            0
          )
      );

    } catch (error) {
      console.error(
        "Mark notification error:",
        error
      );
    }
  };


  // ==========================================
  // MARK ALL NOTIFICATIONS AS READ
  // ==========================================

  const markAllAsRead = async () => {
    const unreadNotifications =
      notifications.filter(
        (notification) =>
          notification.readStatus === false
      );

    if (
      unreadNotifications.length === 0
    ) {
      return;
    }

    try {
      const responses =
        await Promise.all(
          unreadNotifications.map(
            (notification) =>
              fetch(
                `http://localhost:8080/api/notifications/${notification.id}/read`,
                {
                  method: "PUT",
                  headers: {
                    ...getAuthHeaders(),
                  },
                }
              )
          )
        );

      const failed =
        responses.some(
          (response) =>
            !response.ok
        );

      if (failed) {
        throw new Error(
          "Failed to mark all notifications as read."
        );
      }

      setNotifications(
        (previousNotifications) =>
          previousNotifications.map(
            (notification) => ({
              ...notification,
              readStatus: true,
            })
          )
      );

      setUnreadCount(0);

    } catch (error) {
      console.error(
        "Mark all notifications error:",
        error
      );
    }
  };


  // ==========================================
  // NOTIFICATION ICON
  // ==========================================

  const getNotificationIcon = (type) => {
    switch (type) {
      case "RESOURCE":
        return "▣";

      case "ANNOUNCEMENT":
        return "!";

      case "SYSTEM":
        return "⚙";

      default:
        return "•";
    }
  };


  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="dashboard-layout">

      {/* ======================================
          SIDEBAR
      ====================================== */}

      <aside className="dashboard-sidebar">

        {/* BRAND */}

        <div className="sidebar-brand">

          <img
            src="/rosemont-hills-logo.png"
            alt="Rosemont Hills Montessori College Logo"
            className="sidebar-logo"
          />

          <div className="brand-text">

            <h1>
              RLearn Hub
            </h1>

            <p>
              Resource Management
            </p>

          </div>

        </div>


        {/* USER INFORMATION */}

        <div className="sidebar-user">

          <div className="user-avatar">
            {user?.name
              ?.charAt(0)
              ?.toUpperCase() || "U"}
          </div>

          <div className="user-details">

            <strong>
              {user?.name ||
                user?.email ||
                "User"}
            </strong>

            <span>
              {user?.role ||
                "STUDENT"}
            </span>

          </div>

        </div>


        {/* NAVIGATION */}

        <nav className="dashboard-navigation">

          <button
            type="button"
            className="nav-item active"
          >
            <span className="nav-icon">
              ⌂
            </span>

            <span>
              Dashboard
            </span>
          </button>


          <button
            type="button"
            className="nav-item"
            onClick={onBrowseResources}
          >
            <span className="nav-icon">
              ▣
            </span>

            <span>
              Resource Library
            </span>
          </button>


          <button
            type="button"
            className="nav-item"
            onClick={onAnnouncements}
          >
            <span className="nav-icon">
              ⚑
            </span>

            <span>
              Announcements
            </span>
          </button>


          {canManage && (
            <>

              <button
                type="button"
                className="nav-item"
                onClick={onUploadResource}
              >
                <span className="nav-icon">
                  ↑
                </span>

                <span>
                  Upload Resource
                </span>
              </button>


              <button
                type="button"
                className="nav-item"
                onClick={onCreateAnnouncement}
              >
                <span className="nav-icon">
                  +
                </span>

                <span>
                  Create Announcement
                </span>
              </button>

            </>
          )}

        </nav>


        {/* LOGOUT */}

        <button
          type="button"
          className="dashboard-logout"
          onClick={onLogout}
        >
          <span className="logout-icon">
            ↪
          </span>

          <span>
            Logout
          </span>
        </button>

      </aside>


      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      <main className="dashboard-main">

        {/* WELCOME HEADER */}

        <section className="dashboard-welcome">

          <div>

            <span className="dashboard-label">
              ROSEMONT HILLS MONTESSORI COLLEGE
            </span>

            <h2>
              Welcome back{" "}
              <span>👋</span>
            </h2>

            <p>
              {user?.name ||
                "Welcome to RLearn Hub"}
            </p>

          </div>


          {/* NOTIFICATION AREA */}

          <div className="notification-wrapper">

            <button
              type="button"
              className="notification-button"
              onClick={() =>
                setShowNotifications(
                  !showNotifications
                )
              }
              aria-label="Notifications"
            >

              <span className="notification-bell">
                🔔
              </span>

              {unreadCount > 0 && (
                <span className="notification-count">
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>
              )}

            </button>


            {/* NOTIFICATION DROPDOWN */}

            {showNotifications && (
              <div className="notification-dropdown">

                <div className="notification-dropdown-header">

                  <div>

                    <h3>
                      Notifications
                    </h3>

                    <span>
                      {unreadCount} unread
                    </span>

                  </div>


                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="mark-all-read-button"
                      onClick={
                        markAllAsRead
                      }
                    >
                      Mark all as read
                    </button>
                  )}

                </div>


                {notificationLoading && (
                  <div className="notification-status">
                    Loading notifications...
                  </div>
                )}


                {!notificationLoading &&
                  notifications.length === 0 && (
                    <div className="notification-status">

                      <div className="empty-notification-icon">
                        🔔
                      </div>

                      <strong>
                        No notifications
                      </strong>

                      <span>
                        You're all caught up!
                      </span>

                    </div>
                  )}


                {!notificationLoading &&
                  notifications.length > 0 && (
                    <div className="notification-list">

                      {notifications.map(
                        (notification) => (
                          <div
                            className={`notification-item ${
                              notification.readStatus
                                ? "read"
                                : "unread"
                            }`}
                            key={
                              notification.id
                            }
                            onClick={() => {
                              if (
                                !notification.readStatus
                              ) {
                                markNotificationAsRead(
                                  notification.id
                                );
                              }
                            }}
                          >

                            <div
                              className={`notification-type-icon ${(
                                notification.type ||
                                ""
                              ).toLowerCase()}`}
                            >
                              {getNotificationIcon(
                                notification.type
                              )}
                            </div>


                            <div className="notification-content">

                              <strong>
                                {
                                  notification.title
                                }
                              </strong>

                              <p>
                                {
                                  notification.message
                                }
                              </p>

                              <span>
                                {
                                  notification.dateCreated
                                }
                              </span>

                            </div>


                            {!notification.readStatus && (
                              <span className="notification-unread-dot">
                                ●
                              </span>
                            )}

                          </div>
                        )
                      )}

                    </div>
                  )}

              </div>
            )}

          </div>

        </section>


        {/* STATISTICS */}

        <section className="dashboard-statistics">

          <div className="stat-card">

            <div className="stat-card-top">

              <div className="stat-icon navy-icon">
                ▤
              </div>

            </div>

            <strong>
              {statsLoading
                ? "..."
                : stats.resources}
            </strong>

            <span>
              Resources Available
            </span>

          </div>


          <div className="stat-card">

            <div className="stat-card-top">

              <div className="stat-icon gold-icon">
                ↓
              </div>

            </div>

            <strong>
              {statsLoading
                ? "..."
                : stats.downloads}
            </strong>

            <span>
              Downloaded
            </span>

          </div>


          <div className="stat-card">

            <div className="stat-card-top">

              <div className="stat-icon navy-icon">
                ▦
              </div>

            </div>

            <strong>
              {statsLoading
                ? "..."
                : stats.subjects}
            </strong>

            <span>
              Subjects
            </span>

          </div>

        </section>


        {/* RECENTLY ADDED RESOURCES */}

        <section className="dashboard-panel">

          <div className="panel-header">

            <div>

              <h3>
                Recently Added Resources
              </h3>

              <p>
                Latest learning materials added to your library.
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


            {!recentResourcesLoading &&
              recentResources.length === 0 && (
                <div className="resource-empty-state">
                  No resources have been added yet.
                </div>
              )}


            {!recentResourcesLoading &&
              recentResources.map((resource) => (
                <div
                  className="resource-row"
                  key={resource.id}
                >

                  <div className="resource-file-icon">

                    <span>
                      {resource.type
                        ?.toUpperCase()
                        .slice(0, 3) || "FILE"}
                    </span>

                  </div>


                  <div className="resource-information">

                    <strong>
                      {resource.title}
                    </strong>

                    <span>
                      {resource.subject} ·{" "}
                      {resource.author} ·{" "}
                      {resource.dateAdded}
                    </span>

                  </div>


                  <span
                    className={`file-badge ${
                      resource.type
                        ?.toLowerCase() || ""
                    }`}
                  >
                    {resource.type?.toUpperCase() ||
                      "FILE"}
                  </span>

                </div>
              ))}

          </div>

        </section>


        {/* FOOTER */}

        <footer className="dashboard-footer">

          © 2026 RLearn Hub —
          Rosemont Hills Montessori College

        </footer>

      </main>

    </div>
  );
}

export default Dashboard;