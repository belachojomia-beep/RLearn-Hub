
import React, { useEffect, useState } from "react";
import "./AdminDashboard.css";

const announcements = [
  {
    id: 1,
    title: "System Maintenance",
    date: "September 26, 2026",
    message:
      "RLearn-Hub will undergo scheduled maintenance this weekend.",
  },
  {
    id: 2,
    title: "New Learning Resources",
    date: "September 25, 2026",
    message:
      "New educational resources are now available in the library.",
  },
];

function AdminDashboard({ user, onLogout }) {
  const adminName = user?.name || "Administrator";

  const [activePage, setActivePage] = useState("Dashboard");

  // =========================================================
  // RECENT RESOURCES STATE
  // =========================================================

  const [recentResources, setRecentResources] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState("");

  // =========================================================
  // DASHBOARD STATISTICS STATE
  // =========================================================

  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalResources: 0,
    approvedResources: 0,
    pendingResources: 0,
    students: 0,
    teachers: 0,
    admins: 0,
  });

  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  // =========================================================
  // MANAGE USERS STATE
  // =========================================================

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  // =========================================================
  // REVIEW RESOURCES STATE
  // =========================================================

  const [reviewResources, setReviewResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourcesError, setResourcesError] = useState("");
  const [processingResourceId, setProcessingResourceId] = useState(null);

  // =========================================================
  // LOAD DASHBOARD STATISTICS
  // =========================================================

  useEffect(() => {
    if (activePage !== "Dashboard") return;

    const fetchDashboardStats = async () => {
      setStatsLoading(true);
      setStatsError("");

      try {
        const token = sessionStorage.getItem("rlearnhub_token");

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [usersResponse, resourcesResponse, pendingResponse] =
          await Promise.all([
            fetch("http://localhost:8080/api/admin/users", {
              method: "GET",
              headers,
            }),

            fetch("http://localhost:8080/api/resources", {
              method: "GET",
              headers,
            }),

            fetch("http://localhost:8080/api/resources/review", {
              method: "GET",
              headers,
            }),
          ]);

        const responses = [
          usersResponse,
          resourcesResponse,
          pendingResponse,
        ];

        if (responses.some((response) => response.status === 401)) {
          throw new Error(
            "Your login session is invalid or has expired."
          );
        }

        if (responses.some((response) => response.status === 403)) {
          throw new Error(
            "You do not have administrator permission."
          );
        }

        if (responses.some((response) => !response.ok)) {
          throw new Error(
            "Failed to load dashboard statistics."
          );
        }

        const usersData = await usersResponse.json();
        const resourcesData = await resourcesResponse.json();
        const pendingData = await pendingResponse.json();

        const students = usersData.filter(
          (account) => account.role?.toUpperCase() === "STUDENT"
        ).length;

        const teachers = usersData.filter(
          (account) => account.role?.toUpperCase() === "TEACHER"
        ).length;

        const admins = usersData.filter(
          (account) => account.role?.toUpperCase() === "ADMIN"
        ).length;

        setDashboardStats({
          totalUsers: usersData.length,
          totalResources: resourcesData.length + pendingData.length,
          approvedResources: resourcesData.length,
          pendingResources: pendingData.length,
          students,
          teachers,
          admins,
        });
      } catch (error) {
        console.error("Error loading dashboard statistics:", error);

        setStatsError(
          error.message || "Unable to load dashboard statistics."
        );
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [activePage]);

  // =========================================================
  // LOAD RECENT APPROVED RESOURCES
  // =========================================================

  useEffect(() => {
    if (activePage !== "Dashboard") return;

    const fetchRecentResources = async () => {
      setRecentLoading(true);
      setRecentError("");

      try {
        const token = sessionStorage.getItem("rlearnhub_token");

        const response = await fetch(
          "http://localhost:8080/api/resources/recent",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          throw new Error(
            "Your login session is invalid or has expired."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have permission to view resources."
          );
        }

        if (!response.ok) {
          throw new Error("Failed to load recent resources.");
        }

        const data = await response.json();
        setRecentResources(data);
      } catch (error) {
        console.error("Error loading recent resources:", error);

        setRecentError(
          error.message || "Unable to load recent resources."
        );
      } finally {
        setRecentLoading(false);
      }
    };

    fetchRecentResources();
  }, [activePage]);

  // =========================================================
  // LOAD USERS
  // =========================================================

  useEffect(() => {
    if (activePage !== "Manage Users") return;

    const fetchUsers = async () => {
      setUsersLoading(true);
      setUsersError("");

      try {
        const token = sessionStorage.getItem("rlearnhub_token");

        const response = await fetch(
          "http://localhost:8080/api/admin/users",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          throw new Error(
            "Your login session is invalid or has expired."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have administrator permission."
          );
        }

        if (!response.ok) {
          throw new Error("Failed to load users.");
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error loading users:", error);

        setUsersError(error.message || "Unable to load users.");
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [activePage]);

  // =========================================================
  // LOAD PENDING RESOURCES
  // =========================================================

  useEffect(() => {
    if (activePage !== "Review Resources") return;

    const fetchReviewResources = async () => {
      setResourcesLoading(true);
      setResourcesError("");

      try {
        const token = sessionStorage.getItem("rlearnhub_token");

        const response = await fetch(
          "http://localhost:8080/api/resources/review",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          throw new Error(
            "Your login session is invalid or has expired."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have administrator permission."
          );
        }

        if (!response.ok) {
          throw new Error(
            "Failed to load resources for review."
          );
        }

        const data = await response.json();
        setReviewResources(data);
      } catch (error) {
        console.error("Error loading review resources:", error);

        setResourcesError(
          error.message || "Unable to load resources."
        );
      } finally {
        setResourcesLoading(false);
      }
    };

    fetchReviewResources();
  }, [activePage]);

  // =========================================================
  // APPROVE RESOURCE
  // =========================================================

  const handleApproveResource = async (resourceId) => {
    setProcessingResourceId(resourceId);
    setResourcesError("");

    try {
      const token = sessionStorage.getItem("rlearnhub_token");

      const response = await fetch(
        `http://localhost:8080/api/resources/${resourceId}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        throw new Error(
          "Your login session is invalid or has expired."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "You do not have administrator permission."
        );
      }

      if (!response.ok) {
        throw new Error("Failed to approve resource.");
      }

      setReviewResources((currentResources) =>
        currentResources.filter(
          (resource) => resource.id !== resourceId
        )
      );

      // Update the pending count immediately.
      setDashboardStats((current) => ({
        ...current,
        pendingResources: Math.max(
          0,
          current.pendingResources - 1
        ),
        approvedResources: current.approvedResources + 1,
      }));

      // Reload recent resources to include the newly approved item.
      setActivePage("Dashboard");
    } catch (error) {
      console.error("Error approving resource:", error);

      setResourcesError(
        error.message || "Unable to approve resource."
      );
    } finally {
      setProcessingResourceId(null);
    }
  };

  // =========================================================
  // REJECT RESOURCE
  // =========================================================

  const handleRejectResource = async (resourceId) => {
    setProcessingResourceId(resourceId);
    setResourcesError("");

    try {
      const token = sessionStorage.getItem("rlearnhub_token");

      const response = await fetch(
        `http://localhost:8080/api/resources/${resourceId}/reject`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        throw new Error(
          "Your login session is invalid or has expired."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "You do not have administrator permission."
        );
      }

      if (!response.ok) {
        throw new Error("Failed to reject resource.");
      }

      setReviewResources((currentResources) =>
        currentResources.filter(
          (resource) => resource.id !== resourceId
        )
      );

      setDashboardStats((current) => ({
        ...current,
        pendingResources: Math.max(
          0,
          current.pendingResources - 1
        ),
        totalResources: Math.max(
          0,
          current.totalResources - 1
        ),
      }));

      setActivePage("Dashboard");
    } catch (error) {
      console.error("Error rejecting resource:", error);

      setResourcesError(
        error.message || "Unable to reject resource."
      );
    } finally {
      setProcessingResourceId(null);
    }
  };

  // =========================================================
  // NAVIGATION
  // =========================================================

  const navigationItems = [
    "Dashboard",
    "Manage Users",
    "Review Resources",
    "Reports",
    "Announcements",
  ];

  // =========================================================
  // OTHER ADMIN PAGES
  // =========================================================

  const renderPlaceholder = () => {
    switch (activePage) {
      // =====================================================
      // MANAGE USERS
      // =====================================================

      case "Manage Users":
        return (
          <section className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h3>Manage Users</h3>
                <p>
                  Manage student, teacher, and administrator
                  accounts.
                </p>
              </div>
            </div>

            {usersLoading && <p>Loading users...</p>}

            {usersError && (
              <div className="admin-error-message">
                {usersError}
              </div>
            )}

            {!usersLoading &&
              !usersError &&
              users.length === 0 && <p>No users found.</p>}

            {!usersLoading &&
              !usersError &&
              users.length > 0 && (
                <div className="admin-user-table-wrapper">
                  <table className="admin-user-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((account) => (
                        <tr key={account.id}>
                          <td>{account.id}</td>
                          <td>
                            <strong>{account.name}</strong>
                          </td>
                          <td>{account.email}</td>
                          <td>
                            <span
                              className={`admin-role-badge ${
                                account.role?.toLowerCase()
                              }`}
                            >
                              {account.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </section>
        );

      // =====================================================
      // REVIEW RESOURCES
      // =====================================================

      case "Review Resources":
        return (
          <section className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h3>Review Resources</h3>
                <p>
                  Review learning materials uploaded by
                  teachers before they become available.
                </p>
              </div>
            </div>

            {resourcesLoading && <p>Loading resources...</p>}

            {resourcesError && (
              <div className="admin-error-message">
                {resourcesError}
              </div>
            )}

            {!resourcesLoading &&
              !resourcesError &&
              reviewResources.length === 0 && (
                <div className="admin-empty-message">
                  <strong>No Pending Resources</strong>
                  <p>
                    There are currently no resources
                    waiting for administrator review.
                  </p>
                </div>
              )}

            {!resourcesLoading &&
              reviewResources.length > 0 && (
                <div className="admin-resource-list">
                  {reviewResources.map((resource) => (
                    <div
                      className="admin-resource-row"
                      key={resource.id}
                    >
                      <div className="admin-resource-file">
                        <span>{resource.type}</span>
                      </div>

                      <div className="admin-resource-information">
                        <strong>{resource.title}</strong>

                        <span>
                          {resource.subject}
                          {" • "}
                          {resource.topic}
                        </span>

                        <span>
                          Year Level: {resource.yearLevel}
                          {" • "}
                          Uploaded by {resource.author}
                        </span>

                        <span>
                          Date Added: {resource.dateAdded}
                          {" • "}
                          Size: {resource.size}
                        </span>
                      </div>

                      <span className="admin-status-badge pending">
                        PENDING
                      </span>

                      <div className="admin-resource-actions">
                        <button
                          type="button"
                          className="admin-approve-button"
                          disabled={
                            processingResourceId === resource.id
                          }
                          onClick={() =>
                            handleApproveResource(resource.id)
                          }
                        >
                          {processingResourceId === resource.id
                            ? "Processing..."
                            : "Approve"}
                        </button>

                        <button
                          type="button"
                          className="admin-reject-button"
                          disabled={
                            processingResourceId === resource.id
                          }
                          onClick={() =>
                            handleRejectResource(resource.id)
                          }
                        >
                          {processingResourceId === resource.id
                            ? "Processing..."
                            : "Reject"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </section>
        );

      // =====================================================
      // REPORTS
      // =====================================================

      case "Reports":
        return (
          <section className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h3>System Reports</h3>
                <p>
                  View resource, user, and download
                  statistics.
                </p>
              </div>
            </div>

            <p>
              Reports and analytics will be connected
              to the backend database.
            </p>
          </section>
        );

      // =====================================================
      // ANNOUNCEMENTS
      // =====================================================

      case "Announcements":
        return (
          <section className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h3>Announcements</h3>
                <p>
                  View announcements for RLearn Hub.
                </p>
              </div>
            </div>

            <div className="admin-announcement-list">
              {announcements.map((announcement) => (
                <div
                  className="admin-announcement-item"
                  key={announcement.id}
                >
                  <div className="admin-announcement-icon">
                    A
                  </div>

                  <div className="admin-announcement-content">
                    <strong>{announcement.title}</strong>
                    <p>{announcement.message}</p>
                    <span>{announcement.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  // =========================================================
  // MAIN RENDER
  // =========================================================

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-logo">R</div>

          <div className="admin-brand-text">
            <h1>RLearn Hub</h1>
            <p>Learning Resource System</p>
          </div>
        </div>

        {/* ADMIN PROFILE */}
        <div className="admin-user">
          <div className="admin-user-avatar">
            {adminName.charAt(0).toUpperCase()}
          </div>

          <div className="admin-user-details">
            <strong>{adminName}</strong>
            <span>Administrator</span>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="admin-navigation">
          {navigationItems.map((item) => (
            <button
              key={item}
              type="button"
              className={`admin-nav-item ${
                activePage === item ? "active" : ""
              }`}
              onClick={() => setActivePage(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* LOGOUT */}
        <button
          type="button"
          className="admin-logout"
          onClick={onLogout}
        >
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        {activePage === "Dashboard" ? (
          <>
            {/* WELCOME HEADER */}
            <section className="admin-welcome">
              <div>
                <span className="admin-label">
                  Administration
                </span>

                <h2>Admin Dashboard</h2>

                <p>
                  Manage RLearn-Hub users, resources,
                  announcements, and system activities.
                </p>
              </div>

              <div className="admin-status">
                <span className="admin-status-dot"></span>
                System Online
              </div>
            </section>

            {/* STATISTICS */}
            <section className="admin-statistics">
              <div className="admin-stat-card">
                <div className="admin-stat-top">
                
                </div>

                <strong>
                  {statsLoading
                    ? "..."
                    : dashboardStats.totalResources}
                </strong>

                <span>Total Resources</span>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-top">
                
                </div>

                <strong>
                  {statsLoading
                    ? "..."
                    : dashboardStats.totalUsers}
                </strong>

                <span>Total Users</span>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-top">
                
                </div>

                <strong>
                  {statsLoading
                    ? "..."
                    : dashboardStats.approvedResources}
                </strong>

                <span>Approved Resources</span>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-top">
                
                </div>

                <strong>
                  {statsLoading
                    ? "..."
                    : dashboardStats.pendingResources}
                </strong>

                <span>Pending Approvals</span>
              </div>
            </section>

            {statsError && (
              <div className="admin-error-message">
                {statsError}
              </div>
            )}

            {/* DASHBOARD CONTENT */}
            <div className="admin-content-grid">
              {/* RECENT RESOURCES */}
              <section className="admin-panel">
                <div className="admin-panel-header">
                  <div>
                    <h3>Recent Resources</h3>
                    <p>
                      Recently uploaded learning materials
                    </p>
                  </div>

                  <button
                    type="button"
                    className="admin-panel-action"
                    onClick={() =>
                      setActivePage("Review Resources")
                    }
                  >
                    View All →
                  </button>
                </div>

                <div className="admin-resource-list">
                  {recentLoading && (
                    <p>Loading recent resources...</p>
                  )}

                  {recentError && (
                    <div className="admin-error-message">
                      {recentError}
                    </div>
                  )}

                  {!recentLoading &&
                    !recentError &&
                    recentResources.length === 0 && (
                      <p>No approved resources found.</p>
                    )}

                  {!recentLoading &&
                    !recentError &&
                    recentResources.map((resource) => (
                      <div
                        className="admin-resource-row"
                        key={resource.id}
                      >
                        <div className="admin-resource-file">
                          <span>{resource.type}</span>
                        </div>

                        <div className="admin-resource-information">
                          <strong>{resource.title}</strong>

                          <span>
                            {resource.subject}
                            {" • "}
                            Uploaded by{" "}
                            {resource.author || "Unknown"}
                          </span>
                        </div>

                        <span className="admin-status-badge approved">
                          APPROVED
                        </span>
                      </div>
                    ))}
                </div>
              </section>

              {/* ANNOUNCEMENTS */}
              <section className="admin-panel">
                <div className="admin-panel-header">
                  <div>
                    <h3>Announcements</h3>
                    <p>Latest system announcements</p>
                  </div>

                  <button
                    type="button"
                    className="admin-panel-action"
                    onClick={() =>
                      setActivePage("Announcements")
                    }
                  >
                    View All →
                  </button>
                </div>

                <div className="admin-announcement-list">
                  {announcements.map((announcement) => (
                    <div
                      className="admin-announcement-item"
                      key={announcement.id}
                    >
                      <div className="admin-announcement-icon"></div>

                      <div className="admin-announcement-content">
                        <strong>{announcement.title}</strong>
                        <p>{announcement.message}</p>
                        <span>{announcement.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* PENDING APPROVALS */}
            <section className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>Resource Approvals</h3>
                  <p>
                    Resources waiting for administrator review
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-panel-action"
                  onClick={() =>
                    setActivePage("Review Resources")
                  }
                >
                  Review All →
                </button>
              </div>

              <div className="admin-approval-summary">
                <div className="admin-approval-number">
                  {statsLoading
                    ? "..."
                    : dashboardStats.pendingResources}
                </div>

                <div className="admin-approval-information">
                  <strong>Pending Resources</strong>

                  <span>
                    These resources require administrator
                    approval before becoming available to
                    students and teachers.
                  </span>
                </div>
              </div>
            </section>

            {/* FOOTER */}
            <footer className="admin-footer">
              © 2026 RLearn Hub — Rosemont Hills
              Montessori College
            </footer>
          </>
        ) : (
          <>
            {/* OTHER ADMIN PAGES */}
            <section className="admin-welcome">
              <div>
                <span className="admin-label">
                  Administration
                </span>

                <h2>{activePage}</h2>

                <p>
                  RLearn Hub administrator control panel.
                </p>
              </div>

              <div className="admin-status">
                <span className="admin-status-dot"></span>
                System Online
              </div>
            </section>

            {renderPlaceholder()}

            <footer className="admin-footer">
              © 2026 RLearn Hub — Rosemont Hills
              Montessori College
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;