import { useEffect, useState } from "react";
import "./AdminDashboard.css";

/* =========================================================
   RLEARN HUB — ADMIN DASHBOARD
   Rosemont Hills Montessori College

   API GATEWAY
   All frontend requests go through port 8080.
========================================================= */

const BACKEND_API = "http://localhost:8080";
const ANNOUNCEMENT_API = `${BACKEND_API}/api/announcements`;

/* =========================================================
   GET JWT TOKEN
========================================================= */

const getToken = () =>
  sessionStorage.getItem("rlearnhub_token") ||
  localStorage.getItem("rlearnhub_token") ||
  "";

/* =========================================================
   AUTH HEADERS
========================================================= */

const getAuthHeaders = () => {
  const token = getToken();

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};

/* =========================================================
   RESOURCE DOWNLOAD URL
========================================================= */

const getResourceDownloadUrl = (resource) => {
  const email =
    resource?.email ||
    resource?.uploadedByEmail ||
    resource?.authorEmail ||
    "";

  const url = `${BACKEND_API}/api/resources/${resource.id}/download`;

  return email
    ? `${url}?email=${encodeURIComponent(email)}`
    : url;
};

/* =========================================================
   FILE EXTENSION
========================================================= */

const getFileExtension = (resource) => {
  const fileName =
    resource?.fileName ||
    resource?.originalFileName ||
    resource?.name ||
    "";

  const type = resource?.type || "";

  const extension = fileName.includes(".")
    ? fileName.split(".").pop().toLowerCase()
    : "";

  return (
    extension ||
    type.toString().replace(".", "").toLowerCase()
  );
};

/* =========================================================
   CHECK IF BROWSER CAN PREVIEW FILE
========================================================= */

const canPreviewResource = (resource, blobType = "") => {
  const extension = getFileExtension(resource);

  const previewableExtensions = [
    "pdf",
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
    "svg",
    "txt",
  ];

  return (
    previewableExtensions.includes(extension) ||
    blobType.startsWith("application/pdf") ||
    blobType.startsWith("image/") ||
    blobType.startsWith("text/")
  );
};

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function AdminDashboard({ user, onLogout }) {
  const adminName = user?.name || "Administrator";

  const [activePage, setActivePage] = useState("Dashboard");

  /* =======================================================
     DASHBOARD VIEW ALL
  ======================================================= */

  const [showAllRecentResources, setShowAllRecentResources] =
    useState(false);

  const [
    showAllDashboardAnnouncements,
    setShowAllDashboardAnnouncements,
  ] = useState(false);

  const [
    showAllDashboardApprovals,
    setShowAllDashboardApprovals,
  ] = useState(false);

  /* =======================================================
     ANNOUNCEMENTS
  ======================================================= */

  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] =
    useState(false);
  const [announcementsError, setAnnouncementsError] = useState("");
  const [showAnnouncementForm, setShowAnnouncementForm] =
    useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] =
    useState(null);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementSaving, setAnnouncementSaving] = useState(false);

  /* =======================================================
     RECENT RESOURCES
  ======================================================= */

  const [recentResources, setRecentResources] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState("");

  /* =======================================================
     DASHBOARD STATISTICS
  ======================================================= */

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

  /* =======================================================
     MANAGE USERS
  ======================================================= */

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  /* =======================================================
     REVIEW RESOURCES
  ======================================================= */

  const [reviewResources, setReviewResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourcesError, setResourcesError] = useState("");
  const [processingResourceId, setProcessingResourceId] =
    useState(null);

  /* =======================================================
     FILE ACTION STATE
  ======================================================= */

  const [viewingResourceId, setViewingResourceId] = useState(null);
  const [downloadingResourceId, setDownloadingResourceId] =
    useState(null);

  /* =========================================================
     LOAD DASHBOARD STATISTICS
  ========================================================= */

  useEffect(() => {
    if (activePage !== "Dashboard" && activePage !== "Reports") {
      return;
    }

    let cancelled = false;

    const fetchDashboardStats = async () => {
      setStatsLoading(true);
      setStatsError("");

      try {
        const headers = getAuthHeaders();

        const [usersResponse, resourcesResponse, pendingResponse] =
          await Promise.all([
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

        const [usersData, resourcesData, pendingData] =
          await Promise.all([
            usersResponse.json(),
            resourcesResponse.json(),
            pendingResponse.json(),
          ]);

        if (
          !Array.isArray(usersData) ||
          !Array.isArray(resourcesData) ||
          !Array.isArray(pendingData)
        ) {
          throw new Error(
            "The server returned an unexpected dashboard response."
          );
        }

        const students = usersData.filter(
          (account) => account.role?.toUpperCase() === "STUDENT"
        ).length;

        const teachers = usersData.filter(
          (account) => account.role?.toUpperCase() === "TEACHER"
        ).length;

        const admins = usersData.filter(
          (account) => account.role?.toUpperCase() === "ADMIN"
        ).length;

        const resourcesHaveStatus = resourcesData.some(
          (resource) => resource?.status
        );

        let totalResources;
        let approvedResources;

        if (resourcesHaveStatus) {
          totalResources = resourcesData.length;

          approvedResources = resourcesData.filter(
            (resource) => resource.status?.toUpperCase() === "APPROVED"
          ).length;
        } else {
          approvedResources = resourcesData.length;
          totalResources = resourcesData.length + pendingData.length;
        }

        if (cancelled) return;

        setDashboardStats({
          totalUsers: usersData.length,
          totalResources,
          approvedResources,
          pendingResources: pendingData.length,
          students,
          teachers,
          admins,
        });
      } catch (error) {
        console.error("Error loading dashboard statistics:", error);

        if (!cancelled) {
          setStatsError(
            error.message ||
              "Unable to load dashboard statistics."
          );
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    };

    void fetchDashboardStats();

    return () => {
      cancelled = true;
    };
  }, [activePage]);

  /* =========================================================
     LOAD RECENT RESOURCES
  ========================================================= */

  useEffect(() => {
    if (activePage !== "Dashboard") return;

    let cancelled = false;

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
          throw new Error("Failed to load recent resources.");
        }

        const data = await response.json();

        if (!cancelled) {
          setRecentResources(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error loading recent resources:", error);

        if (!cancelled) {
          setRecentError(
            error.message || "Unable to load recent resources."
          );
        }
      } finally {
        if (!cancelled) {
          setRecentLoading(false);
        }
      }
    };

    void fetchRecentResources();

    return () => {
      cancelled = true;
    };
  }, [activePage]);

  /* =========================================================
     LOAD USERS
  ========================================================= */

  useEffect(() => {
    if (activePage !== "Manage Users") return;

    let cancelled = false;

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

        if (!cancelled) {
          setUsers(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error loading users:", error);

        if (!cancelled) {
          setUsersError(error.message || "Unable to load users.");
        }
      } finally {
        if (!cancelled) {
          setUsersLoading(false);
        }
      }
    };

    void fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [activePage]);

  /* =========================================================
     LOAD REVIEW RESOURCES
  ========================================================= */

  useEffect(() => {
    if (
      activePage !== "Dashboard" &&
      activePage !== "Review Resources"
    ) {
      return;
    }

    let cancelled = false;

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

        if (!cancelled) {
          setReviewResources(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error loading review resources:", error);

        if (!cancelled) {
          setResourcesError(
            error.message || "Unable to load resources."
          );
        }
      } finally {
        if (!cancelled) {
          setResourcesLoading(false);
        }
      }
    };

    void fetchReviewResources();

    return () => {
      cancelled = true;
    };
  }, [activePage]);

  /* =========================================================
     LOAD ANNOUNCEMENTS
  ========================================================= */

  useEffect(() => {
    if (
      activePage !== "Dashboard" &&
      activePage !== "Announcements"
    ) {
      return;
    }

    let cancelled = false;

    const fetchAnnouncements = async () => {
      setAnnouncementsLoading(true);
      setAnnouncementsError("");

      try {
        const response = await fetch(ANNOUNCEMENT_API, {
          method: "GET",
          headers: getAuthHeaders(),
        });

        if (response.status === 401) {
          throw new Error(
            "Your login session is invalid or has expired."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have permission to view announcements."
          );
        }

        if (!response.ok) {
          throw new Error("Failed to load announcements.");
        }

        const data = await response.json();

        const sortedAnnouncements = (
          Array.isArray(data) ? [...data] : []
        ).sort((a, b) => Number(b.id) - Number(a.id));

        if (!cancelled) {
          setAnnouncements(sortedAnnouncements);
        }
      } catch (error) {
        console.error("Error loading announcements:", error);

        if (!cancelled) {
          setAnnouncementsError(
            error.message || "Unable to load announcements."
          );
        }
      } finally {
        if (!cancelled) {
          setAnnouncementsLoading(false);
        }
      }
    };

    void fetchAnnouncements();

    return () => {
      cancelled = true;
    };
  }, [activePage]);

  /* =========================================================
     VIEW RESOURCE
  ========================================================= */

  const handleViewResource = async (resource) => {
    if (!resource?.id) {
      setResourcesError(
        "This resource does not have a valid ID."
      );
      return;
    }

    setViewingResourceId(resource.id);
    setResourcesError("");

    let previewWindow = null;
    let objectUrl = null;

    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Your login session is missing. Please log in again."
        );
      }

      previewWindow = window.open("", "_blank");

      if (!previewWindow) {
        throw new Error(
          "The browser blocked the preview window. Please allow pop-ups for RLearn Hub."
        );
      }

      previewWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <title>Opening Resource...</title>
            <style>
              body {
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                font-family: Arial, sans-serif;
                background: #f5f7fa;
                color: #0b2a4a;
              }
            </style>
          </head>
          <body>Opening resource...</body>
        </html>
      `);

      const response = await fetch(
        getResourceDownloadUrl(resource),
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
          "You do not have permission to view this resource."
        );
      }

      if (!response.ok) {
        throw new Error(
          `Unable to open resource. Server returned ${response.status}.`
        );
      }

      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);

      if (canPreviewResource(resource, blob.type)) {
        previewWindow.location.href = objectUrl;

        const urlToRevoke = objectUrl;
        window.setTimeout(() => {
          URL.revokeObjectURL(urlToRevoke);
        }, 60000);

        objectUrl = null;
      } else {
        const fileName =
          resource.fileName ||
          resource.originalFileName ||
          resource.title ||
          "resource";

        const downloadLink = document.createElement("a");
        downloadLink.href = objectUrl;
        downloadLink.download = fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();

        previewWindow.close();

        const urlToRevoke = objectUrl;
        window.setTimeout(() => {
          URL.revokeObjectURL(urlToRevoke);
        }, 1000);

        objectUrl = null;
      }
    } catch (error) {
      console.error("Error viewing resource:", error);

      if (previewWindow && !previewWindow.closed) {
        previewWindow.close();
      }

      setResourcesError(
        error.message || "Unable to view resource."
      );
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      setViewingResourceId(null);
    }
  };

  /* =========================================================
     DOWNLOAD RESOURCE
  ========================================================= */

  const handleDownloadResource = async (resource) => {
    if (!resource?.id) {
      setResourcesError(
        "This resource does not have a valid ID."
      );
      return;
    }

    setDownloadingResourceId(resource.id);
    setResourcesError("");

    let objectUrl = null;

    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Your login session is missing. Please log in again."
        );
      }

      const response = await fetch(
        getResourceDownloadUrl(resource),
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
          "You do not have permission to download this resource."
        );
      }

      if (!response.ok) {
        throw new Error(
          `Unable to download resource. Server returned ${response.status}.`
        );
      }

      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);

      const fileName =
        resource.fileName ||
        resource.originalFileName ||
        resource.title ||
        `resource-${resource.id}`;

      const downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.download = fileName;
      downloadLink.style.display = "none";

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      const urlToRevoke = objectUrl;

      window.setTimeout(() => {
        URL.revokeObjectURL(urlToRevoke);
      }, 1000);

      objectUrl = null;
    } catch (error) {
      console.error("Error downloading resource:", error);

      setResourcesError(
        error.message || "Unable to download resource."
      );
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      setDownloadingResourceId(null);
    }
  };

  /* =========================================================
     APPROVE RESOURCE
  ========================================================= */

  const handleApproveResource = async (resourceId) => {
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
        throw new Error("Failed to approve resource.");
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
        approvedResources: current.approvedResources + 1,
        totalResources:
          current.totalResources === 0
            ? 1
            : current.totalResources,
      }));

      if (activePage === "Dashboard") {
        setActivePage("Review Resources");
      }
    } catch (error) {
      console.error("Error approving resource:", error);

      setResourcesError(
        error.message || "Unable to approve resource."
      );
    } finally {
      setProcessingResourceId(null);
    }
  };

  /* =========================================================
     REJECT RESOURCE
  ========================================================= */

  const handleRejectResource = async (resourceId) => {
    const confirmed = window.confirm(
      "Are you sure you want to reject this resource?"
    );

    if (!confirmed) return;

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

      if (activePage === "Dashboard") {
        setActivePage("Review Resources");
      }
    } catch (error) {
      console.error("Error rejecting resource:", error);

      setResourcesError(
        error.message || "Unable to reject resource."
      );
    } finally {
      setProcessingResourceId(null);
    }
  };

  /* =========================================================
     ANNOUNCEMENT FORM
  ========================================================= */

  const handleOpenAnnouncementForm = () => {
    setEditingAnnouncementId(null);
    setAnnouncementTitle("");
    setAnnouncementMessage("");
    setAnnouncementsError("");
    setShowAnnouncementForm(true);
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncementId(announcement.id);
    setAnnouncementTitle(announcement.title || "");
    setAnnouncementMessage(announcement.message || "");
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

  /* =========================================================
     SAVE ANNOUNCEMENT
  ========================================================= */

  const handleSaveAnnouncement = async (event) => {
    event.preventDefault();

    if (
      !announcementTitle.trim() ||
      !announcementMessage.trim()
    ) {
      window.alert(
        "Please enter both a title and a message."
      );
      return;
    }

    setAnnouncementsError("");
    setAnnouncementSaving(true);

    try {
      const formattedDate = new Date().toLocaleDateString(
        "en-US",
        {
          month: "long",
          day: "numeric",
          year: "numeric",
        }
      );

      const announcementData = {
        title: announcementTitle.trim(),
        message: announcementMessage.trim(),
        date: formattedDate,
        author: adminName,
      };

      const isEditing = editingAnnouncementId !== null;

      const url = isEditing
        ? `${ANNOUNCEMENT_API}/${editingAnnouncementId}`
        : ANNOUNCEMENT_API;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(announcementData),
      });

      if (response.status === 401) {
        throw new Error(
          "Your login session is invalid or has expired."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "You do not have permission to manage announcements."
        );
      }

      if (!response.ok) {
        throw new Error(
          isEditing
            ? "Failed to update announcement."
            : "Failed to create announcement."
        );
      }

      const savedAnnouncement =
        response.status === 204
          ? {
              id: editingAnnouncementId,
              ...announcementData,
            }
          : await response.json();

      setAnnouncements((currentAnnouncements) => {
        if (isEditing) {
          return currentAnnouncements
            .map((announcement) =>
              announcement.id === editingAnnouncementId
                ? savedAnnouncement
                : announcement
            )
            .sort((a, b) => Number(b.id) - Number(a.id));
        }

        return [savedAnnouncement, ...currentAnnouncements]
          .sort((a, b) => Number(b.id) - Number(a.id));
      });

      handleCancelAnnouncement();
    } catch (error) {
      console.error("Error saving announcement:", error);

      setAnnouncementsError(
        error.message || "Unable to save announcement."
      );

      setAnnouncementSaving(false);
    }
  };

  /* =========================================================
     DELETE ANNOUNCEMENT
  ========================================================= */

  const handleDeleteAnnouncement = async (announcementId) => {
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

      if (response.status === 401) {
        throw new Error(
          "Your login session is invalid or has expired."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "You do not have permission to delete announcements."
        );
      }

      if (!response.ok) {
        throw new Error("Failed to delete announcement.");
      }

      setAnnouncements((currentAnnouncements) =>
        currentAnnouncements.filter(
          (announcement) => announcement.id !== announcementId
        )
      );
    } catch (error) {
      console.error("Error deleting announcement:", error);

      setAnnouncementsError(
        error.message || "Unable to delete announcement."
      );
    }
  };

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const navigationItems = [
    "Dashboard",
    "Manage Users",
    "Review Resources",
    "Reports",
    "Announcements",
  ];

  /* =========================================================
     RESOURCE ACTION BUTTONS
  ========================================================= */

  const renderResourceActions = (resource) => {
    const isProcessing =
      processingResourceId === resource.id;

    const isViewing =
      viewingResourceId === resource.id;

    const isDownloading =
      downloadingResourceId === resource.id;

    const isBusy =
      isProcessing || isViewing || isDownloading;

    return (
      <div className="admin-resource-actions">
        <button
          type="button"
          className="admin-view-button"
          disabled={isBusy}
          onClick={() => handleViewResource(resource)}
          title="Open the resource for review"
        >
          {isViewing ? "Opening..." : "View Resource"}
        </button>

        <button
          type="button"
          className="admin-download-button"
          disabled={isBusy}
          onClick={() => handleDownloadResource(resource)}
          title="Download the original resource"
        >
          {isDownloading ? "Downloading..." : "Download"}
        </button>

        <button
          type="button"
          className="admin-approve-button"
          disabled={isBusy}
          onClick={() => handleApproveResource(resource.id)}
        >
          {isProcessing ? "Processing..." : "Approve"}
        </button>

        <button
          type="button"
          className="admin-reject-button"
          disabled={isBusy}
          onClick={() => handleRejectResource(resource.id)}
        >
          {isProcessing ? "Processing..." : "Reject"}
        </button>
      </div>
    );
  };

  /* =========================================================
     OTHER ADMIN PAGES
  ========================================================= */

  const renderPlaceholder = () => {
    switch (activePage) {
      case "Manage Users":
        return (
          <section className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h3>Manage Users</h3>
                <p>
                  Manage student, teacher, and administrator accounts.
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
                <div className="admin-table-wrapper">
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
                                account.role?.toLowerCase() || ""
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

      case "Review Resources":
        return (
          <section className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h3>Review Resources</h3>
                <p>
                  Review teacher-uploaded learning materials before
                  making them available to students.
                </p>
              </div>
            </div>

            <div className="admin-review-instruction">
              <strong>Administrator Review</strong>
              <p>
                Open or download each resource and check its content,
                title, subject, topic, year level, relevance, and
                accuracy before approving it.
              </p>
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
                    There are currently no resources waiting for
                    administrator review.
                  </p>
                </div>
              )}

            {!resourcesLoading &&
              reviewResources.length > 0 && (
                <div className="admin-review-list">
                  {reviewResources.map((resource) => (
                    <div
                      className="admin-review-card"
                      key={resource.id}
                    >
                      <div className="admin-resource-file">
                        <span>
                          {resource.type ||
                            getFileExtension(resource) ||
                            "FILE"}
                        </span>
                      </div>

                      <div className="admin-review-information">
                        <h4>
                          {resource.title || "Untitled Resource"}
                        </h4>

                        <p>
                          <strong>Subject:</strong>{" "}
                          {resource.subject || "N/A"}
                        </p>

                        <p>
                          <strong>Topic:</strong>{" "}
                          {resource.topic || "N/A"}
                        </p>

                        <p>
                          <strong>Year Level:</strong>{" "}
                          {resource.yearLevel || "N/A"}
                        </p>

                        <p>
                          <strong>Uploaded by:</strong>{" "}
                          {resource.author || "Unknown"}
                        </p>

                        <small>
                          <strong>File:</strong>{" "}
                          {resource.fileName || "Uploaded resource"}
                          {" • "}
                          <strong>Size:</strong>{" "}
                          {resource.size || "N/A"}
                        </small>
                      </div>

                      <span className="admin-status-badge pending">
                        PENDING
                      </span>

                      {renderResourceActions(resource)}
                    </div>
                  ))}
                </div>
              )}
          </section>
        );

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
                  View user, resource, and system statistics.
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
                        Overview of registered RLearn Hub users.
                      </p>
                    </div>
                  </div>

                  <div className="admin-report-grid">
                    <div className="admin-report-card">
                      <span>Total Users</span>
                      <strong>{dashboardStats.totalUsers}</strong>
                    </div>

                    <div className="admin-report-card">
                      <span>Students</span>
                      <strong>{dashboardStats.students}</strong>
                    </div>

                    <div className="admin-report-card">
                      <span>Teachers</span>
                      <strong>{dashboardStats.teachers}</strong>
                    </div>

                    <div className="admin-report-card">
                      <span>Administrators</span>
                      <strong>{dashboardStats.admins}</strong>
                    </div>
                  </div>
                </div>

                <div className="admin-report-section">
                  <div className="admin-report-section-header">
                    <div>
                      <h4>Resource Report</h4>
                      <p>
                        Overview of learning resources in the system.
                      </p>
                    </div>
                  </div>

                  <div className="admin-report-grid">
                    <div className="admin-report-card">
                      <span>Total Resources</span>
                      <strong>{dashboardStats.totalResources}</strong>
                    </div>

                    <div className="admin-report-card">
                      <span>Approved Resources</span>
                      <strong>
                        {dashboardStats.approvedResources}
                      </strong>
                    </div>

                    <div className="admin-report-card">
                      <span>Pending Resources</span>
                      <strong>{dashboardStats.pendingResources}</strong>
                    </div>

                    <div className="admin-report-card">
                      <span>Approval Rate</span>
                      <strong>{approvalRate}%</strong>
                    </div>
                  </div>
                </div>

                <div className="admin-report-summary">
                  <div>
                    <span>System Summary</span>
                    <p>
                      RLearn Hub currently has{" "}
                      <strong>{dashboardStats.totalUsers}</strong>{" "}
                      registered users and{" "}
                      <strong>{dashboardStats.totalResources}</strong>{" "}
                      resources.
                    </p>
                  </div>

                  <div className="admin-report-summary-status">
                    <strong>{dashboardStats.pendingResources}</strong>
                    <span>Resources waiting for review</span>
                  </div>
                </div>
              </>
            )}
          </section>
        );
      }

      case "Announcements":
        return (
          <section className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h3>Announcements</h3>
                <p>
                  Create and manage announcements for RLearn Hub users.
                </p>
              </div>

              <button
                type="button"
                className="admin-create-announcement-button"
                onClick={handleOpenAnnouncementForm}
              >
                + Create Announcement
              </button>
            </div>

            {announcementsLoading && (
              <p>Loading announcements...</p>
            )}

            {announcementsError && (
              <div className="admin-error-message">
                {announcementsError}
              </div>
            )}

            {showAnnouncementForm && (
              <form
                className="admin-announcement-form"
                onSubmit={handleSaveAnnouncement}
              >
                <div className="admin-announcement-form-header">
                  <div>
                    <h4>
                      {editingAnnouncementId
                        ? "Edit Announcement"
                        : "Create Announcement"}
                    </h4>
                    <p>
                      {editingAnnouncementId
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
                    value={announcementTitle}
                    onChange={(event) =>
                      setAnnouncementTitle(event.target.value)
                    }
                    placeholder="Enter announcement title"
                    disabled={announcementSaving}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="announcementMessage">
                    Message
                  </label>
                  <textarea
                    id="announcementMessage"
                    value={announcementMessage}
                    onChange={(event) =>
                      setAnnouncementMessage(event.target.value)
                    }
                    placeholder="Enter announcement message"
                    rows={5}
                    disabled={announcementSaving}
                    required
                  />
                </div>

                <div className="admin-announcement-form-actions">
                  <button
                    type="button"
                    className="admin-cancel-button"
                    onClick={handleCancelAnnouncement}
                    disabled={announcementSaving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="admin-save-button"
                    disabled={announcementSaving}
                  >
                    {announcementSaving
                      ? "Saving..."
                      : editingAnnouncementId
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
                  <strong>No Announcements</strong>
                  <p>
                    There are currently no announcements.
                  </p>
                </div>
              )}

            {!announcementsLoading &&
              announcements.length > 0 && (
                <div className="admin-announcement-list">
                  {announcements.map((announcement) => (
                    <div
                      className="admin-announcement-row"
                      key={announcement.id}
                    >
                      <div className="admin-announcement-icon">
                        A
                      </div>

                      <div className="admin-announcement-content">
                        <strong>{announcement.title}</strong>
                        <p>{announcement.message}</p>
                        <small>
                          {announcement.date ||
                            announcement.datePosted ||
                            announcement.dateCreated ||
                            ""}
                        </small>
                      </div>

                      <div className="admin-management-actions">
                        <button
                          type="button"
                          className="admin-edit-button"
                          onClick={() =>
                            handleEditAnnouncement(announcement)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="admin-delete-button"
                          onClick={() =>
                            handleDeleteAnnouncement(announcement.id)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </section>
        );

      default:
        return null;
    }
  };

  /* =========================================================
     MAIN RENDER
  ========================================================= */

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-logo">
            <img
              src="/rosemont-hills-logo.png"
              alt="Rosemont Hills Montessori College"
            />
          </div>

          <div className="admin-brand-text">
            <h1>RLearn Hub</h1>
            <span>Learning Resource System</span>
          </div>
        </div>

        <div className="admin-user">
          <div className="admin-user-avatar">
            {adminName.charAt(0).toUpperCase()}
          </div>

          <div>
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
                activePage === item ? "active" : ""
              }`}
              onClick={() => setActivePage(item)}
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

      {/* MAIN CONTENT */}
      <main className="admin-main">
        {activePage === "Dashboard" ? (
          <>
            {/* WELCOME */}
            <section className="admin-welcome">
              <div>
                <span className="admin-label">
                  Administration
                </span>
                <h2>Admin Dashboard</h2>
                <p>
                  Manage RLearn Hub users, resources,
                  announcements, and system activities.
                </p>
              </div>
            </section>

            {/* STATISTICS */}
            <section className="admin-statistics">
              <div className="admin-stat-card">
                <div className="admin-stat-content">
                  <strong>
                    {statsLoading
                      ? "..."
                      : dashboardStats.totalResources}
                  </strong>
                  <span>Total Resources</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-content">
                  <strong>
                    {statsLoading
                      ? "..."
                      : dashboardStats.totalUsers}
                  </strong>
                  <span>Total Users</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-content">
                  <strong>
                    {statsLoading
                      ? "..."
                      : dashboardStats.approvedResources}
                  </strong>
                  <span>Approved Resources</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-content">
                  <strong>
                    {statsLoading
                      ? "..."
                      : dashboardStats.pendingResources}
                  </strong>
                  <span>Pending Approvals</span>
                </div>
              </div>
            </section>

            {statsError && (
              <div className="admin-error-message">
                {statsError}
              </div>
            )}

            {/* RECENT RESOURCES */}
            <section className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>Recent Resources</h3>
                  <p>Recently uploaded learning materials</p>
                </div>

                {recentResources.length > 3 && (
                  <button
                    type="button"
                    className="admin-panel-action"
                    onClick={() =>
                      setShowAllRecentResources((current) => !current)
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
                  (
                    showAllRecentResources
                      ? recentResources
                      : recentResources.slice(0, 3)
                  ).map((resource) => (
                    <div
                      className="admin-resource-row"
                      key={resource.id}
                    >
                      <div className="admin-resource-file">
                        <span>
                          {resource.type ||
                            getFileExtension(resource) ||
                            "FILE"}
                        </span>
                      </div>

                      <div className="admin-resource-information">
                        <strong>{resource.title}</strong>
                        <span>
                          {resource.subject || "N/A"}
                          {" • "}
                          Uploaded by {resource.author || "Unknown"}
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
                  <p>Loading announcements...</p>
                )}

                {announcementsError && (
                  <div className="admin-error-message">
                    {announcementsError}
                  </div>
                )}

                {!announcementsLoading &&
                  !announcementsError &&
                  announcements.length === 0 && (
                    <p>No announcements available.</p>
                  )}

                {!announcementsLoading &&
                  !announcementsError &&
                  (
                    showAllDashboardAnnouncements
                      ? announcements
                      : announcements.slice(0, 3)
                  ).map((announcement) => (
                    <div
                      className="admin-announcement-row"
                      key={announcement.id}
                    >
                      <div className="admin-announcement-icon">
                        A
                      </div>

                      <div className="admin-announcement-content">
                        <strong>{announcement.title}</strong>
                        <p>{announcement.message}</p>
                        <small>
                          {announcement.date ||
                            announcement.datePosted ||
                            announcement.dateCreated ||
                            ""}
                        </small>
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            {/* RESOURCE APPROVALS */}
            <section className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>Resource Approvals</h3>
                  <p>
                    Resources waiting for administrator review
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
                <p>Loading pending resources...</p>
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
                    <strong>No Pending Resources</strong>
                    <p>
                      There are currently no resources waiting for
                      administrator review.
                    </p>
                  </div>
                )}

              {!resourcesLoading &&
                !resourcesError &&
                (
                  showAllDashboardApprovals
                    ? reviewResources
                    : reviewResources.slice(0, 3)
                ).map((resource) => (
                  <div
                    className="admin-review-card"
                    key={resource.id}
                  >
                    <div className="admin-resource-file">
                      <span>
                        {resource.type ||
                          getFileExtension(resource) ||
                          "FILE"}
                      </span>
                    </div>

                    <div className="admin-review-information">
                      <h4>
                        {resource.title || "Untitled Resource"}
                      </h4>

                      <p>
                        {resource.subject || "N/A"}
                        {" • "}
                        {resource.topic || "N/A"}
                      </p>

                      <p>
                        Year Level: {resource.yearLevel || "N/A"}
                        {" • "}
                        Uploaded by {resource.author || "Unknown"}
                      </p>

                      <small>
                        Date Added: {resource.dateAdded || "N/A"}
                        {" • "}
                        Size: {resource.size || "N/A"}
                      </small>
                    </div>

                    <span className="admin-status-badge pending">
                      PENDING
                    </span>

                    {renderResourceActions(resource)}
                  </div>
                ))}
            </section>

            {/* FOOTER */}
            <footer className="admin-footer">
              © 2026 RLearn Hub — Rosemont Hills Montessori College
            </footer>
          </>
        ) : (
          <>
            {/* OTHER PAGE HEADER */}
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
            </section>

            {renderPlaceholder()}

            <footer className="admin-footer">
              © 2026 RLearn Hub — Rosemont Hills Montessori College
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
