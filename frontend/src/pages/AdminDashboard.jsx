import React, { useEffect, useState } from "react";
import "./AdminDashboard.css";

const BACKEND_API = "http://localhost:8080";
const ANNOUNCEMENT_API =
  "http://localhost:8080/api/announcements";

function AdminDashboard({ user, onLogout }) {
  const adminName = user?.name || "Administrator";

  const [activePage, setActivePage] = useState("Dashboard");

  // =========================================================
  // DASHBOARD VIEW ALL STATES
  // =========================================================

  const [showAllRecentResources, setShowAllRecentResources] =
    useState(false);

  const [showAllDashboardAnnouncements, setShowAllDashboardAnnouncements] =
    useState(false);

  const [showAllDashboardApprovals, setShowAllDashboardApprovals] =
    useState(false);

  // =========================================================
  // ANNOUNCEMENTS
  // =========================================================

  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] =
    useState(false);
  const [announcementsError, setAnnouncementsError] =
    useState("");

  const [showAnnouncementForm, setShowAnnouncementForm] =
    useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] =
    useState(null);

  const [announcementTitle, setAnnouncementTitle] =
    useState("");
  const [announcementMessage, setAnnouncementMessage] =
    useState("");
  const [announcementSaving, setAnnouncementSaving] =
    useState(false);

  // =========================================================
  // RECENT RESOURCES
  // =========================================================

  const [recentResources, setRecentResources] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState("");

  // =========================================================
  // DASHBOARD STATISTICS
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
  // MANAGE USERS
  // =========================================================

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  // =========================================================
  // REVIEW RESOURCES
  // =========================================================

  const [reviewResources, setReviewResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] =
    useState(false);
  const [resourcesError, setResourcesError] = useState("");
  const [processingResourceId, setProcessingResourceId] =
    useState(null);

  // =========================================================
  // GET AUTH HEADERS
  // =========================================================

  const getAuthHeaders = () => {
    const token =
      sessionStorage.getItem("rlearnhub_token");

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // =========================================================
  // READ BACKEND ERROR
  // =========================================================

  const getErrorMessage = async (
    response,
    fallbackMessage
  ) => {
    try {
      const text = await response.text();

      if (!text) {
        return fallbackMessage;
      }

      try {
        const data = JSON.parse(text);

        return (
          data.message ||
          data.error ||
          data.details ||
          text
        );
      } catch {
        return text;
      }
    } catch {
      return fallbackMessage;
    }
  };

  // =========================================================
  // LOAD DASHBOARD STATISTICS
  // =========================================================

  useEffect(() => {
    if (activePage !== "Dashboard") return;

    const fetchDashboardStats = async () => {
      setStatsLoading(true);
      setStatsError("");

      try {
        const headers = getAuthHeaders();

        const [
          usersResponse,
          resourcesResponse,
          pendingResponse,
        ] = await Promise.all([
          fetch(`${BACKEND_API}/api/admin/users`, {
            method: "GET",
            headers,
          }),

          fetch(`${BACKEND_API}/api/resources`, {
            method: "GET",
            headers,
          }),

          fetch(`${BACKEND_API}/api/resources/review`, {
            method: "GET",
            headers,
          }),
        ]);

        const responses = [
          usersResponse,
          resourcesResponse,
          pendingResponse,
        ];

        if (
          responses.some(
            (response) => response.status === 401
          )
        ) {
          throw new Error(
            "Your login session is invalid or has expired."
          );
        }

        if (
          responses.some(
            (response) => response.status === 403
          )
        ) {
          throw new Error(
            "You do not have administrator permission."
          );
        }

        if (
          responses.some(
            (response) => !response.ok
          )
        ) {
          throw new Error(
            "Failed to load dashboard statistics."
          );
        }

        const usersData = await usersResponse.json();
        const resourcesData =
          await resourcesResponse.json();
        const pendingData =
          await pendingResponse.json();

        const students = usersData.filter(
          (account) =>
            account.role?.toUpperCase() === "STUDENT"
        ).length;

        const teachers = usersData.filter(
          (account) =>
            account.role?.toUpperCase() === "TEACHER"
        ).length;

        const admins = usersData.filter(
          (account) =>
            account.role?.toUpperCase() === "ADMIN"
        ).length;

        setDashboardStats({
          totalUsers: usersData.length,

          totalResources:
            resourcesData.length +
            pendingData.length,

          approvedResources:
            resourcesData.length,

          pendingResources:
            pendingData.length,

          students,
          teachers,
          admins,
        });
      } catch (error) {
        console.error(
          "Error loading dashboard statistics:",
          error
        );

        setStatsError(
          error.message ||
            "Unable to load dashboard statistics."
        );
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [activePage]);

  // =========================================================
  // LOAD RECENT RESOURCES
  // =========================================================

  useEffect(() => {
    if (activePage !== "Dashboard") return;

    const fetchRecentResources = async () => {
      setRecentLoading(true);
      setRecentError("");

      try {
        const response = await fetch(
          `${BACKEND_API}/api/resources/recent`,
          {
            method: "GET",
            headers: getAuthHeaders(),
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
          throw new Error(
            "Failed to load recent resources."
          );
        }

        const data = await response.json();

        setRecentResources(data);
      } catch (error) {
        console.error(
          "Error loading recent resources:",
          error
        );

        setRecentError(
          error.message ||
            "Unable to load recent resources."
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
        const response = await fetch(
          `${BACKEND_API}/api/admin/users`,
          {
            method: "GET",
            headers: getAuthHeaders(),
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
        console.error(
          "Error loading users:",
          error
        );

        setUsersError(
          error.message ||
            "Unable to load users."
        );
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [activePage]);

  // =========================================================
  // LOAD REVIEW RESOURCES
  // =========================================================

  useEffect(() => {
    if (
      activePage !== "Dashboard" &&
      activePage !== "Review Resources"
    ) {
      return;
    }

    const fetchReviewResources = async () => {
      setResourcesLoading(true);
      setResourcesError("");

      try {
        const response = await fetch(
          `${BACKEND_API}/api/resources/review`,
          {
            method: "GET",
            headers: getAuthHeaders(),
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
        console.error(
          "Error loading review resources:",
          error
        );

        setResourcesError(
          error.message ||
            "Unable to load review resources."
        );
      } finally {
        setResourcesLoading(false);
      }
    };

    fetchReviewResources();
  }, [activePage]);

  // =========================================================
  // LOAD ANNOUNCEMENTS
  // =========================================================

  useEffect(() => {
    if (
      activePage !== "Dashboard" &&
      activePage !== "Announcements"
    ) {
      return;
    }

    const fetchAnnouncements = async () => {
      setAnnouncementsLoading(true);
      setAnnouncementsError("");

      try {
        const response = await fetch(
          ANNOUNCEMENT_API,
          {
            method: "GET",
            headers: getAuthHeaders(),
          }
        );

        if (!response.ok) {
          const errorMessage =
            await getErrorMessage(
              response,
              "Failed to load announcements."
            );

          throw new Error(errorMessage);
        }

        const data = await response.json();

        const sortedAnnouncements = [...data].sort(
          (a, b) =>
            Number(b.id) - Number(a.id)
        );

        setAnnouncements(
          sortedAnnouncements
        );
      } catch (error) {
        console.error(
          "Error loading announcements:",
          error
        );

        setAnnouncementsError(
          error.message ||
            "Unable to load announcements."
        );
      } finally {
        setAnnouncementsLoading(false);
      }
    };

    fetchAnnouncements();
  }, [activePage]);

  // =========================================================
  // APPROVE RESOURCE
  // =========================================================

  const handleApproveResource = async (
    resourceId
  ) => {
    setProcessingResourceId(resourceId);
    setResourcesError("");

    try {
      const response = await fetch(
        `${BACKEND_API}/api/resources/${resourceId}/approve`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
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
        const errorMessage =
          await getErrorMessage(
            response,
            "Failed to approve resource."
          );

        throw new Error(errorMessage);
      }

      setReviewResources(
        (currentResources) =>
          currentResources.filter(
            (resource) =>
              resource.id !== resourceId
          )
      );

      setDashboardStats((current) => ({
        ...current,

        pendingResources: Math.max(
          0,
          current.pendingResources - 1
        ),

        approvedResources:
          current.approvedResources + 1,
      }));

      setActivePage("Dashboard");
    } catch (error) {
      console.error(
        "Error approving resource:",
        error
      );

      setResourcesError(
        error.message ||
          "Unable to approve resource."
      );
    } finally {
      setProcessingResourceId(null);
    }
  };

  // =========================================================
  // REJECT RESOURCE
  // =========================================================

  const handleRejectResource = async (
    resourceId
  ) => {
    setProcessingResourceId(resourceId);
    setResourcesError("");

    try {
      const response = await fetch(
        `${BACKEND_API}/api/resources/${resourceId}/reject`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
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
        const errorMessage =
          await getErrorMessage(
            response,
            "Failed to reject resource."
          );

        throw new Error(errorMessage);
      }

      setReviewResources(
        (currentResources) =>
          currentResources.filter(
            (resource) =>
              resource.id !== resourceId
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
      console.error(
        "Error rejecting resource:",
        error
      );

      setResourcesError(
        error.message ||
          "Unable to reject resource."
      );
    } finally {
      setProcessingResourceId(null);
    }
  };

  // =========================================================
  // ANNOUNCEMENT FORM
  // =========================================================

  const handleOpenAnnouncementForm = () => {
    setEditingAnnouncementId(null);
    setAnnouncementTitle("");
    setAnnouncementMessage("");
    setAnnouncementsError("");
    setShowAnnouncementForm(true);
  };

  const handleEditAnnouncement = (
    announcement
  ) => {
    setEditingAnnouncementId(
      announcement.id
    );

    setAnnouncementTitle(
      announcement.title || ""
    );

    setAnnouncementMessage(
      announcement.message || ""
    );

    setAnnouncementsError("");
    setShowAnnouncementForm(true);
  };

  const handleCancelAnnouncement = () => {
    setShowAnnouncementForm(false);
    setEditingAnnouncementId(null);
    setAnnouncementTitle("");
    setAnnouncementMessage("");
    setAnnouncementSaving(false);
  };

  // =========================================================
  // SAVE ANNOUNCEMENT
  // =========================================================

  const handleSaveAnnouncement = async (
    event
  ) => {
    event.preventDefault();

    const title = announcementTitle.trim();
    const message = announcementMessage.trim();

    if (!title || !message) {
      alert(
        "Please enter both a title and a message."
      );

      return;
    }

    // The backend identifies the author by the actual
    // logged-in user's name.
    const actualAuthor =
      user?.name?.toString().trim();

    if (!actualAuthor) {
      setAnnouncementsError(
        "Your account name could not be found. Please log out and log in again."
      );

      return;
    }

    setAnnouncementsError("");
    setAnnouncementSaving(true);

    try {
      const today = new Date();

      const formattedDate =
        today.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

      // IMPORTANT:
      // The backend Announcement entity/controller uses
      // datePosted, NOT date.
      const announcementData = {
        title: title,
        message: message,
        datePosted: formattedDate,
        author: actualAuthor,
      };

      console.log(
        "Sending announcement:",
        announcementData
      );

      // =====================================================
      // UPDATE EXISTING ANNOUNCEMENT
      // =====================================================

      if (editingAnnouncementId !== null) {
        const response = await fetch(
          `${ANNOUNCEMENT_API}/${editingAnnouncementId}`,
          {
            method: "PUT",
            headers: {
              ...getAuthHeaders(),
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              announcementData
            ),
          }
        );

        if (!response.ok) {
          const errorMessage =
            await getErrorMessage(
              response,
              "Failed to update announcement."
            );

          throw new Error(errorMessage);
        }

        const updatedAnnouncement =
          await response.json();

        setAnnouncements(
          (currentAnnouncements) =>
            currentAnnouncements
              .map((announcement) =>
                Number(announcement.id) ===
                Number(editingAnnouncementId)
                  ? updatedAnnouncement
                  : announcement
              )
              .sort(
                (a, b) =>
                  Number(b.id) -
                  Number(a.id)
              )
        );

        handleCancelAnnouncement();

        return;
      }

      // =====================================================
      // CREATE NEW ANNOUNCEMENT
      // =====================================================

      const response = await fetch(
        ANNOUNCEMENT_API,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            announcementData
          ),
        }
      );

      if (!response.ok) {
        const errorMessage =
          await getErrorMessage(
            response,
            "Failed to create announcement."
          );

        console.error(
          "Announcement creation failed:",
          response.status,
          errorMessage
        );

        throw new Error(errorMessage);
      }

      const newAnnouncement =
        await response.json();

      console.log(
        "Announcement successfully created:",
        newAnnouncement
      );

      setAnnouncements(
        (currentAnnouncements) =>
          [
            newAnnouncement,
            ...currentAnnouncements,
          ].sort(
            (a, b) =>
              Number(b.id) -
              Number(a.id)
          )
      );

      handleCancelAnnouncement();
    } catch (error) {
      console.error(
        "Error saving announcement:",
        error
      );

      setAnnouncementsError(
        error.message ||
          "Unable to save announcement."
      );

      setAnnouncementSaving(false);
    }
  };

  // =========================================================
  // DELETE ANNOUNCEMENT
  // =========================================================

  const handleDeleteAnnouncement = async (
    announcementId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this announcement?"
    );

    if (!confirmed) return;

    setAnnouncementsError("");

    try {
      const response = await fetch(
        `${ANNOUNCEMENT_API}/${announcementId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorMessage =
          await getErrorMessage(
            response,
            "Failed to delete announcement."
          );

        throw new Error(errorMessage);
      }

      setAnnouncements(
        (currentAnnouncements) =>
          currentAnnouncements.filter(
            (announcement) =>
              Number(announcement.id) !==
              Number(announcementId)
          )
      );
    } catch (error) {
      console.error(
        "Error deleting announcement:",
        error
      );

      setAnnouncementsError(
        error.message ||
          "Unable to delete announcement."
      );
    }
  };

  // =========================================================
  // ANNOUNCEMENT AUTHOR
  // =========================================================

  const getAnnouncementAuthor = (
    announcement
  ) => {
    const author =
      announcement?.author
        ?.toString()
        .trim();

    if (!author) {
      return "Posted by Administrator";
    }

    const normalized =
      author.toUpperCase();

    if (
      normalized === "ADMIN" ||
      normalized === "ADMINISTRATOR"
    ) {
      return "Posted by Administrator";
    }

    if (normalized === "TEACHER") {
      return "Posted by Teacher";
    }

    return `Posted by ${author}`;
  };

  // =========================================================
  // ANNOUNCEMENT DATE
  // =========================================================

  const getAnnouncementDate = (
    announcement
  ) => {
    return (
      announcement?.datePosted ||
      announcement?.date ||
      "Date unavailable"
    );
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
                  Manage student, teacher,
                  and administrator accounts.
                </p>
              </div>
            </div>

            {usersLoading && (
              <p>Loading users...</p>
            )}

            {usersError && (
              <div className="admin-error-message">
                {usersError}
              </div>
            )}

            {!usersLoading &&
              !usersError &&
              users.length === 0 && (
                <p>No users found.</p>
              )}

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
                            <strong>
                              {account.name}
                            </strong>
                          </td>

                          <td>
                            {account.email}
                          </td>

                          <td>
                            <span
                              className={`admin-role-badge ${
                                account.role?.toLowerCase() ||
                                ""
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
                  Review learning materials
                  uploaded by teachers before
                  they become available.
                </p>
              </div>
            </div>

            {resourcesLoading && (
              <p>Loading resources...</p>
            )}

            {resourcesError && (
              <div className="admin-error-message">
                {resourcesError}
              </div>
            )}

            {!resourcesLoading &&
              !resourcesError &&
              reviewResources.length === 0 && (
                <div className="admin-empty-message">
                  <strong>
                    No Pending Resources
                  </strong>

                  <p>
                    There are currently no
                    resources waiting for
                    administrator review.
                  </p>
                </div>
              )}

            {!resourcesLoading &&
              !resourcesError &&
              reviewResources.length > 0 && (
                <div className="admin-resource-list">
                  {reviewResources.map(
                    (resource) => (
                      <div
                        className="admin-resource-row admin-review-resource-row"
                        key={resource.id}
                      >
                        <div className="admin-resource-file">
                          <span>
                            {resource.type}
                          </span>
                        </div>

                        <div className="admin-resource-information">
                          <strong>
                            {resource.title}
                          </strong>

                          <span>
                            {resource.subject}
                            {" • "}
                            {resource.topic}
                          </span>

                          <span>
                            Year Level:{" "}
                            {resource.yearLevel}
                            {" • "}
                            Uploaded by{" "}
                            {resource.author}
                          </span>

                          <span>
                            Date Added:{" "}
                            {resource.dateAdded}
                            {" • "}
                            Size:{" "}
                            {resource.size}
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
                              processingResourceId ===
                              resource.id
                            }
                            onClick={() =>
                              handleApproveResource(
                                resource.id
                              )
                            }
                          >
                            {processingResourceId ===
                            resource.id
                              ? "Processing..."
                              : "Approve"}
                          </button>

                          <button
                            type="button"
                            className="admin-reject-button"
                            disabled={
                              processingResourceId ===
                              resource.id
                            }
                            onClick={() =>
                              handleRejectResource(
                                resource.id
                              )
                            }
                          >
                            {processingResourceId ===
                            resource.id
                              ? "Processing..."
                              : "Reject"}
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
          </section>
        );

      // =====================================================
      // REPORTS
      // =====================================================

      case "Reports": {
        const approvalRate =
          dashboardStats.totalResources > 0
            ? Math.round(
                (dashboardStats.approvedResources /
                  dashboardStats.totalResources) *
                  100
              )
            : 0;

        return (
          <section className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h3>System Reports</h3>

                <p>
                  View user, resource,
                  and system statistics.
                </p>
              </div>
            </div>

            {statsLoading ? (
              <div className="admin-report-loading">
                Loading reports...
              </div>
            ) : statsError ? (
              <div className="admin-error-message">
                {statsError}
              </div>
            ) : (
              <>
                <div className="admin-report-section">
                  <div className="admin-report-section-header">
                    <div>
                      <h4>User Report</h4>

                      <p>
                        Overview of registered
                        RLearn Hub users.
                      </p>
                    </div>
                  </div>

                  <div className="admin-report-grid">
                    <div className="admin-report-card">
                      <span>
                        Total Users
                      </span>

                      <strong>
                        {
                          dashboardStats.totalUsers
                        }
                      </strong>
                    </div>

                    <div className="admin-report-card">
                      <span>Students</span>

                      <strong>
                        {
                          dashboardStats.students
                        }
                      </strong>
                    </div>

                    <div className="admin-report-card">
                      <span>Teachers</span>

                      <strong>
                        {
                          dashboardStats.teachers
                        }
                      </strong>
                    </div>

                    <div className="admin-report-card">
                      <span>
                        Administrators
                      </span>

                      <strong>
                        {
                          dashboardStats.admins
                        }
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="admin-report-section">
                  <div className="admin-report-section-header">
                    <div>
                      <h4>
                        Resource Report
                      </h4>

                      <p>
                        Overview of learning
                        resources in the system.
                      </p>
                    </div>
                  </div>

                  <div className="admin-report-grid">
                    <div className="admin-report-card">
                      <span>
                        Total Resources
                      </span>

                      <strong>
                        {
                          dashboardStats.totalResources
                        }
                      </strong>
                    </div>

                    <div className="admin-report-card">
                      <span>
                        Approved Resources
                      </span>

                      <strong>
                        {
                          dashboardStats.approvedResources
                        }
                      </strong>
                    </div>

                    <div className="admin-report-card">
                      <span>
                        Pending Resources
                      </span>

                      <strong>
                        {
                          dashboardStats.pendingResources
                        }
                      </strong>
                    </div>

                    <div className="admin-report-card">
                      <span>
                        Approval Rate
                      </span>

                      <strong>
                        {approvalRate}%
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="admin-report-summary">
                  <div>
                    <span>System Summary</span>

                    <p>
                      RLearn Hub currently has{" "}
                      <strong>
                        {
                          dashboardStats.totalUsers
                        }
                      </strong>{" "}
                      registered users and{" "}
                      <strong>
                        {
                          dashboardStats.totalResources
                        }
                      </strong>{" "}
                      resources.
                    </p>
                  </div>

                  <div className="admin-report-summary-status">
                    <strong>
                      {
                        dashboardStats.pendingResources
                      }
                    </strong>

                    <span>
                      Resources waiting
                      for review
                    </span>
                  </div>
                </div>
              </>
            )}
          </section>
        );
      }

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
                  Create and manage
                  announcements for
                  RLearn Hub users.
                </p>
              </div>

              <button
                type="button"
                className="admin-create-button"
                onClick={
                  handleOpenAnnouncementForm
                }
              >
                + Create Announcement
              </button>
            </div>

            {announcementsLoading && (
              <p>
                Loading announcements...
              </p>
            )}

            {announcementsError && (
              <div className="admin-error-message">
                {announcementsError}
              </div>
            )}

            {showAnnouncementForm && (
              <form
                className="admin-announcement-form"
                onSubmit={
                  handleSaveAnnouncement
                }
              >
                <div className="admin-announcement-form-header">
                  <div>
                    <h4>
                      {editingAnnouncementId !==
                      null
                        ? "Edit Announcement"
                        : "Create Announcement"}
                    </h4>

                    <p>
                      {editingAnnouncementId !==
                      null
                        ? "Update the announcement details."
                        : "Create a new announcement for RLearn Hub users."}
                    </p>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label htmlFor="announcementTitle">
                    Title
                  </label>

                  <input
                    id="announcementTitle"
                    type="text"
                    value={
                      announcementTitle
                    }
                    onChange={(event) =>
                      setAnnouncementTitle(
                        event.target.value
                      )
                    }
                    placeholder="Enter announcement title"
                    disabled={
                      announcementSaving
                    }
                  />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="announcementMessage">
                    Message
                  </label>

                  <textarea
                    id="announcementMessage"
                    value={
                      announcementMessage
                    }
                    onChange={(event) =>
                      setAnnouncementMessage(
                        event.target.value
                      )
                    }
                    placeholder="Enter announcement message"
                    rows="5"
                    disabled={
                      announcementSaving
                    }
                  />
                </div>

                <div className="admin-announcement-form-actions">
                  <button
                    type="button"
                    className="admin-cancel-button"
                    onClick={
                      handleCancelAnnouncement
                    }
                    disabled={
                      announcementSaving
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="admin-save-button"
                    disabled={
                      announcementSaving
                    }
                  >
                    {announcementSaving
                      ? "Saving..."
                      : editingAnnouncementId !==
                        null
                      ? "Save Changes"
                      : "Publish Announcement"}
                  </button>
                </div>
              </form>
            )}

            {!announcementsLoading &&
              !announcementsError &&
              !showAnnouncementForm &&
              announcements.length === 0 && (
                <div className="admin-empty-message">
                  <strong>
                    No Announcements
                  </strong>

                  <p>
                    There are currently
                    no announcements.
                  </p>
                </div>
              )}

            {!announcementsLoading &&
              !announcementsError &&
              announcements.length > 0 && (
                <div className="admin-announcement-list">
                  {announcements.map(
                    (announcement) => (
                      <div
                        className="admin-announcement-item admin-announcement-managed"
                        key={announcement.id}
                      >
                        <div className="admin-announcement-icon">
                          A
                        </div>

                        <div className="admin-announcement-content">
                          <strong>
                            {
                              announcement.title
                            }
                          </strong>

                          <p>
                            {
                              announcement.message
                            }
                          </p>

                          <span className="admin-announcement-date">
                            {getAnnouncementDate(
                              announcement
                            )}
                          </span>

                          <small className="admin-announcement-author">
                            {
                              getAnnouncementAuthor(
                                announcement
                              )
                            }
                          </small>
                        </div>

                        <div className="admin-announcement-actions">
                          <button
                            type="button"
                            className="admin-edit-button"
                            onClick={() =>
                              handleEditAnnouncement(
                                announcement
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="admin-delete-button"
                            onClick={() =>
                              handleDeleteAnnouncement(
                                announcement.id
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
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
      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-logo">R</div>

          <div className="admin-brand-text">
            <h1>RLearn Hub</h1>

            <p>
              Learning Resource System
            </p>
          </div>
        </div>

        <div className="admin-user">
          <div className="admin-user-avatar">
            {adminName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="admin-user-details">
            <strong>{adminName}</strong>

            <span>Administrator</span>
          </div>
        </div>

        <nav className="admin-navigation">
          {navigationItems.map((item) => (
            <button
              key={item}
              type="button"
              className={`admin-nav-item ${
                activePage === item
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActivePage(item)
              }
            >
              {item}
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="admin-logout"
          onClick={onLogout}
        >
          Logout
        </button>
      </aside>

      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <main className="admin-main">
        {activePage === "Dashboard" ? (
          <>
            {/* =================================================
                WELCOME
                ================================================= */}

            <section className="admin-welcome">
              <div>
                <span className="admin-label">
                  Administration
                </span>

                <h2>Admin Dashboard</h2>

                <p>
                  Manage RLearn-Hub users,
                  resources, announcements,
                  and system activities.
                </p>
              </div>

              <div className="admin-status">
                <span className="admin-status-dot"></span>
                System Online
              </div>
            </section>

            {/* =================================================
                STATISTICS
                ================================================= */}

            <section className="admin-statistics">
              <div className="admin-stat-card">
                <strong>
                  {statsLoading
                    ? "..."
                    : dashboardStats.totalResources}
                </strong>

                <span>
                  Total Resources
                </span>
              </div>

              <div className="admin-stat-card">
                <strong>
                  {statsLoading
                    ? "..."
                    : dashboardStats.totalUsers}
                </strong>

                <span>Total Users</span>
              </div>

              <div className="admin-stat-card">
                <strong>
                  {statsLoading
                    ? "..."
                    : dashboardStats.approvedResources}
                </strong>

                <span>
                  Approved Resources
                </span>
              </div>

              <div className="admin-stat-card">
                <strong>
                  {statsLoading
                    ? "..."
                    : dashboardStats.pendingResources}
                </strong>

                <span>
                  Pending Approvals
                </span>
              </div>
            </section>

            {statsError && (
              <div className="admin-error-message">
                {statsError}
              </div>
            )}

            {/* =================================================
                RECENT RESOURCES
                ================================================= */}

            <section className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>
                    Recent Resources
                  </h3>

                  <p>
                    Recently uploaded
                    learning materials
                  </p>
                </div>

                {recentResources.length > 3 && (
                  <button
                    type="button"
                    className="admin-panel-action"
                    onClick={() =>
                      setShowAllRecentResources(
                        (current) => !current
                      )
                    }
                  >
                    {showAllRecentResources
                      ? "Show Less ↑"
                      : "View All →"}
                  </button>
                )}
              </div>

              <div className="admin-resource-list">
                {recentLoading && (
                  <p>
                    Loading recent
                    resources...
                  </p>
                )}

                {recentError && (
                  <div className="admin-error-message">
                    {recentError}
                  </div>
                )}

                {!recentLoading &&
                  !recentError &&
                  recentResources.length ===
                    0 && (
                    <p>
                      No approved
                      resources found.
                    </p>
                  )}

                {!recentLoading &&
                  !recentError &&
                  recentResources.length > 0 &&
                  (showAllRecentResources
                    ? recentResources
                    : recentResources.slice(0, 3)
                  ).map((resource) => (
                    <div
                      className="admin-resource-row"
                      key={resource.id}
                    >
                      <div className="admin-resource-file">
                        <span>
                          {resource.type}
                        </span>
                      </div>

                      <div className="admin-resource-information">
                        <strong>
                          {resource.title}
                        </strong>

                        <span>
                          {resource.subject}
                          {" • "}
                          Uploaded by{" "}
                          {resource.author ||
                            "Unknown"}
                        </span>
                      </div>

                      <span className="admin-status-badge approved">
                        APPROVED
                      </span>
                    </div>
                  ))}
              </div>
            </section>

            {/* =================================================
                ANNOUNCEMENTS
                ================================================= */}

            <section className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>Announcements</h3>

                  <p>
                    Latest system
                    announcements
                  </p>
                </div>

                {announcements.length > 3 && (
                  <button
                    type="button"
                    className="admin-panel-action"
                    onClick={() =>
                      setShowAllDashboardAnnouncements(
                        (current) => !current
                      )
                    }
                  >
                    {showAllDashboardAnnouncements
                      ? "Show Less ↑"
                      : "View All →"}
                  </button>
                )}
              </div>

              <div className="admin-announcement-list">
                {announcementsLoading && (
                  <p>
                    Loading announcements...
                  </p>
                )}

                {announcementsError && (
                  <div className="admin-error-message">
                    {announcementsError}
                  </div>
                )}

                {!announcementsLoading &&
                  !announcementsError &&
                  announcements.length ===
                    0 && (
                    <p>
                      No announcements
                      available.
                    </p>
                  )}

                {!announcementsLoading &&
                  !announcementsError &&
                  announcements.length > 0 &&
                  (showAllDashboardAnnouncements
                    ? announcements
                    : announcements.slice(0, 3)
                  ).map((announcement) => (
                    <div
                      className="admin-announcement-item"
                      key={announcement.id}
                    >
                      <div className="admin-announcement-icon">
                        A
                      </div>

                      <div className="admin-announcement-content">
                        <strong>
                          {
                            announcement.title
                          }
                        </strong>

                        <p>
                          {
                            announcement.message
                          }
                        </p>

                        <span className="admin-announcement-date">
                          {getAnnouncementDate(
                            announcement
                          )}
                        </span>

                        <small className="admin-announcement-author">
                          {
                            getAnnouncementAuthor(
                              announcement
                            )
                          }
                        </small>
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            {/* =================================================
                RESOURCE APPROVALS
                ================================================= */}

            <section className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>
                    Resource Approvals
                  </h3>

                  <p>
                    Resources waiting for
                    administrator review
                  </p>
                </div>

                {reviewResources.length > 3 && (
                  <button
                    type="button"
                    className="admin-panel-action"
                    onClick={() =>
                      setShowAllDashboardApprovals(
                        (current) => !current
                      )
                    }
                  >
                    {showAllDashboardApprovals
                      ? "Show Less ↑"
                      : "Review All →"}
                  </button>
                )}
              </div>

              {resourcesLoading && (
                <p>
                  Loading pending resources...
                </p>
              )}

              {resourcesError && (
                <div className="admin-error-message">
                  {resourcesError}
                </div>
              )}

              {!resourcesLoading &&
                !resourcesError &&
                reviewResources.length === 0 && (
                  <div className="admin-empty-message">
                    <strong>
                      No Pending Resources
                    </strong>

                    <p>
                      There are currently no
                      resources waiting for
                      administrator review.
                    </p>
                  </div>
                )}

              {!resourcesLoading &&
                !resourcesError &&
                reviewResources.length > 0 && (
                  <div className="admin-resource-list">
                    {(showAllDashboardApprovals
                      ? reviewResources
                      : reviewResources.slice(0, 3)
                    ).map((resource) => (
                      <div
                        className="admin-resource-row admin-review-resource-row"
                        key={resource.id}
                      >
                        <div className="admin-resource-file">
                          <span>
                            {resource.type}
                          </span>
                        </div>

                        <div className="admin-resource-information">
                          <strong>
                            {resource.title}
                          </strong>

                          <span>
                            {resource.subject}
                            {" • "}
                            {resource.topic}
                          </span>

                          <span>
                            Year Level:{" "}
                            {resource.yearLevel}
                            {" • "}
                            Uploaded by{" "}
                            {resource.author ||
                              "Unknown"}
                          </span>

                          <span>
                            Date Added:{" "}
                            {resource.dateAdded}
                            {" • "}
                            Size:{" "}
                            {resource.size}
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
                              processingResourceId ===
                              resource.id
                            }
                            onClick={() =>
                              handleApproveResource(
                                resource.id
                              )
                            }
                          >
                            {processingResourceId ===
                            resource.id
                              ? "Processing..."
                              : "Approve"}
                          </button>

                          <button
                            type="button"
                            className="admin-reject-button"
                            disabled={
                              processingResourceId ===
                              resource.id
                            }
                            onClick={() =>
                              handleRejectResource(
                                resource.id
                              )
                            }
                          >
                            {processingResourceId ===
                            resource.id
                              ? "Processing..."
                              : "Reject"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </section>

            {/* =================================================
                FOOTER
                ================================================= */}

            <footer className="admin-footer">
              © 2026 RLearn Hub — Rosemont Hills
              Montessori College
            </footer>
          </>
        ) : (
          <>
            {/* =================================================
                OTHER ADMIN PAGES
                ================================================= */}

            <section className="admin-welcome">
              <div>
                <span className="admin-label">
                  Administration
                </span>

                <h2>{activePage}</h2>

                <p>
                  RLearn Hub administrator
                  control panel.
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