
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import "./Resources.css";
import ResourceDetails from "./ResourceDetails";

const API_URL = "http://localhost:8080";
const SCHOOL_LOGO = "/rosemont-hills-logo.png";

/* =========================================================
   AUTHENTICATION
========================================================= */

const getToken = () => {
  const token =
    sessionStorage.getItem("rlearnhub_token") ||
    localStorage.getItem("rlearnhub_token");

  if (!token) {
    throw new Error(
      "Authentication token not found. Please log in again."
    );
  }

  return token;
};

const getAuthHeaders = (accept = "application/json") => ({
  Authorization: `Bearer ${getToken()}`,
  Accept: accept,
});

/* =========================================================
   API ERROR HANDLING
========================================================= */

const getErrorMessage = async (response, defaultMessage) => {
  let message = `${defaultMessage} Status: ${response.status}`;

  try {
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const data = await response.json();

      message =
        data?.message ||
        data?.error ||
        data?.detail ||
        message;
    } else {
      const responseText = await response.text();

      if (responseText) {
        message = responseText;
      }
    }
  } catch {
    // Keep the default error message.
  }

  return message;
};

/* =========================================================
   RESOURCE HELPERS
========================================================= */

const getResourceType = (resource) => {
  const value =
    resource?.type ||
    resource?.fileType ||
    resource?.fileName?.split(".").pop() ||
    "FILE";

  return value
    .toString()
    .replace(/^\./, "")
    .toUpperCase();
};

const getResourceDate = (resource) =>
  resource?.dateAdded ||
  resource?.createdAt ||
  resource?.date ||
  resource?.dateCreated ||
  null;

const getDateTimestamp = (resource) => {
  const value = getResourceDate(resource);

  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const formatDate = (value) => {
  if (!value) {
    return "Date not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.toString();
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const normalizeResourceList = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  if (Array.isArray(data?.resources)) {
    return data.resources;
  }

  return [];
};

/* =========================================================
   RESOURCES COMPONENT
========================================================= */

function Resources({ user, onBackToDashboard }) {
  /* =======================================================
     FILTER STATES
  ======================================================= */

  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All Subjects");
  const [yearLevel, setYearLevel] = useState("All Year Levels");
  const [topic, setTopic] = useState("All Topics");

  /* =======================================================
     RESOURCE STATES
  ======================================================= */

  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  /* =======================================================
     USER ROLE
  ======================================================= */

  const userRole = user?.role?.toString().toUpperCase();

  const isStudent = userRole === "STUDENT";
  const isTeacher = userRole === "TEACHER";
  const isAdmin = userRole === "ADMIN";

  const canDelete = isTeacher || isAdmin;

  /* =======================================================
     LOAD RESOURCES

     All requests go through API Gateway :8080.
     Students can only see approved resources.
  ======================================================= */

  const loadResources = useCallback(
    async (signal) => {
      try {
        const response = await fetch(
          `${API_URL}/api/resources`,
          {
            method: "GET",
            headers: getAuthHeaders(),
            signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            await getErrorMessage(
              response,
              "Failed to load resources."
            )
          );
        }

        const data = await response.json();

        let resourceData = normalizeResourceList(data);

        if (isStudent) {
          resourceData = resourceData.filter(
            (resource) =>
              resource?.status?.toString().toUpperCase() ===
              "APPROVED"
          );
        }

        resourceData.sort(
          (a, b) =>
            getDateTimestamp(b) - getDateTimestamp(a)
        );

        setResources(resourceData);
        setError("");
      } catch (loadError) {
        if (
          loadError?.name === "AbortError"
        ) {
          return;
        }

        console.error("Error loading resources:", loadError);

        setResources([]);
        setError(
          loadError?.message ||
            "Unable to load resources from the server."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [isStudent]
  );

  /* =======================================================
     LOAD WHEN PAGE OPENS

     Defer the initial call to avoid triggering the
     set-state-in-effect lint rule.
  ======================================================= */

  useEffect(() => {
    const controller = new AbortController();

    Promise.resolve().then(() => {
      if (!controller.signal.aborted) {
        void loadResources(controller.signal);
      }
    });

    return () => {
      controller.abort();
    };
  }, [loadResources]);

  /* =======================================================
     RETRY LOADING
  ======================================================= */

  const handleRetry = useCallback(async () => {
    const controller = new AbortController();

    setLoading(true);
    setError("");

    await loadResources(controller.signal);
  }, [loadResources]);

  /* =======================================================
     SUBJECT OPTIONS
  ======================================================= */

  const subjectOptions = useMemo(() => {
    const values = resources
      .map((resource) => resource?.subject)
      .filter(Boolean)
      .map((value) => value.toString());

    return [...new Set(values)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [resources]);

  /* =======================================================
     YEAR LEVEL OPTIONS
  ======================================================= */

  const yearLevelOptions = useMemo(() => {
    const values = resources
      .map((resource) => resource?.yearLevel)
      .filter(Boolean)
      .map((value) => value.toString());

    return [...new Set(values)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [resources]);

  /* =======================================================
     TOPIC OPTIONS
  ======================================================= */

  const topicOptions = useMemo(() => {
    const values = resources
      .map((resource) => resource?.topic)
      .filter(Boolean)
      .map((value) => value.toString());

    return [...new Set(values)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [resources]);

  /* =======================================================
     FILTER RESOURCES
  ======================================================= */

  const filteredResources = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return resources.filter((resource) => {
      const title =
        resource?.title?.toString().toLowerCase() || "";

      const resourceSubject =
        resource?.subject?.toString().toLowerCase() || "";

      const resourceTopic =
        resource?.topic?.toString().toLowerCase() || "";

      const resourceAuthor =
        resource?.author?.toString().toLowerCase() || "";

      const matchesSearch =
        !searchText ||
        title.includes(searchText) ||
        resourceSubject.includes(searchText) ||
        resourceTopic.includes(searchText) ||
        resourceAuthor.includes(searchText);

      const matchesSubject =
        subject === "All Subjects" ||
        resource?.subject?.toString() === subject;

      const matchesYear =
        yearLevel === "All Year Levels" ||
        resource?.yearLevel?.toString() === yearLevel;

      const matchesTopic =
        topic === "All Topics" ||
        resource?.topic?.toString() === topic;

      return (
        matchesSearch &&
        matchesSubject &&
        matchesYear &&
        matchesTopic
      );
    });
  }, [resources, search, subject, yearLevel, topic]);

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setSubject("All Subjects");
    setYearLevel("All Year Levels");
    setTopic("All Topics");
  }, []);

  /* =======================================================
     DOWNLOAD RESOURCE
  ======================================================= */

  const handleDownload = async (resource) => {
    if (!resource?.id) {
      window.alert("This resource does not have a valid ID.");
      return;
    }

    if (!user?.email) {
      window.alert(
        "Your account information is missing. Please log in again."
      );
      return;
    }

    try {
      setDownloadingId(resource.id);

      const downloadUrl =
        `${API_URL}/api/resources/${resource.id}/download` +
        `?email=${encodeURIComponent(user.email)}`;

      const response = await fetch(downloadUrl, {
        method: "GET",
        headers: getAuthHeaders("*/*"),
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Download failed."
          )
        );
      }

      const blob = await response.blob();

      let fileName =
        resource?.fileName ||
        resource?.title ||
        "resource";

      const contentDisposition =
        response.headers.get("Content-Disposition");

      if (contentDisposition) {
        const match = contentDisposition.match(
          /filename\*=(?:UTF-8'')?([^;]+)|filename="?([^";]+)"?/i
        );

        if (match) {
          const rawFileName = (match[1] || match[2])
            ?.trim()
            .replace(/^["']|["']$/g, "");

          if (rawFileName) {
            try {
              fileName = decodeURIComponent(rawFileName);
            } catch {
              fileName = rawFileName;
            }
          }
        }
      }

      const resourceType =
        getResourceType(resource).toLowerCase();

      if (
        !fileName.toString().includes(".") &&
        resourceType &&
        resourceType !== "file"
      ) {
        fileName = `${fileName}.${resourceType}`;
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = fileName;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (downloadError) {
      console.error(
        "Download resource error:",
        downloadError
      );

      window.alert(
        downloadError?.message ||
          "Unable to download this resource."
      );
    } finally {
      setDownloadingId(null);
    }
  };

  /* =======================================================
     DELETE RESOURCE

     Teachers and admins can delete resources.
  ======================================================= */

  const handleDelete = async (resource) => {
    if (!canDelete) {
      window.alert(
        "You do not have permission to delete resources."
      );
      return;
    }

    if (!resource?.id) {
      window.alert("This resource does not have a valid ID.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${resource.title || "this resource"}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(resource.id);

      const response = await fetch(
        `${API_URL}/api/resources/${resource.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Failed to delete resource."
          )
        );
      }

      setResources((currentResources) =>
        currentResources.filter(
          (item) => item.id !== resource.id
        )
      );

      setSelectedResource((currentResource) =>
        currentResource?.id === resource.id
          ? null
          : currentResource
      );

      window.alert(
        `"${resource.title || "Resource"}" was deleted successfully.`
      );
    } catch (deleteError) {
      console.error(
        "Delete resource error:",
        deleteError
      );

      window.alert(
        deleteError?.message ||
          "Unable to delete this resource."
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =======================================================
     RESOURCE DETAILS
  ======================================================= */

  if (selectedResource) {
    return (
      <ResourceDetails
        resource={selectedResource}
        user={user}
        onBackToResources={() => setSelectedResource(null)}
      />
    );
  }

  /* =======================================================
     MAIN RESOURCE LIBRARY PAGE
  ======================================================= */

  return (
    <div className="resources-page">
      <header className="resources-header">
        <div className="resources-header-brand">
          <img
            src={SCHOOL_LOGO}
            alt="Rosemont Hills Montessori College Logo"
            className="resources-logo"
          />

          <div className="resources-brand-text">
            <h1>RLearn Hub</h1>
            <p>Resource Library</p>
          </div>
        </div>

        <button
          type="button"
          className="resources-back-button"
          onClick={onBackToDashboard}
        >
          ← Back to Dashboard
        </button>
      </header>

      <main className="resources-content">
        <section className="resources-title-section">
          <span className="resources-label">RLEARN HUB</span>
          <h2>Resource Library</h2>
          <p>
            Find learning materials, resources, and study materials.
          </p>
        </section>

        {/* SEARCH AND FILTERS */}

        <section className="resource-filters">
          <div className="resource-search">
            <span className="search-icon" aria-hidden="true">
              🔎
            </span>

            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search resources"
            />
          </div>

          <select
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            aria-label="Filter by subject"
          >
            <option value="All Subjects">All Subjects</option>

            {subjectOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={yearLevel}
            onChange={(event) => setYearLevel(event.target.value)}
            aria-label="Filter by year level"
          >
            <option value="All Year Levels">
              All Year Levels
            </option>

            {yearLevelOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            aria-label="Filter by topic"
          >
            <option value="All Topics">All Topics</option>

            {topicOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </section>

        {/* RESOURCE COUNT */}

        <div className="resource-summary">
          <div className="resource-count">
            <strong>{filteredResources.length}</strong>

            <span>
              {filteredResources.length === 1
                ? "resource found"
                : "resources found"}
            </span>
          </div>

          <button
            type="button"
            className="clear-filters"
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>
        </div>

        {/* LOADING STATE */}

        {loading && (
          <div className="no-resources">
            <div className="empty-icon">⏳</div>
            <h2>Loading resources...</h2>
            <p>
              Please wait while the Resource Library loads.
            </p>
          </div>
        )}

        {/* ERROR STATE */}

        {!loading && error && (
          <div className="no-resources">
            <div className="empty-icon">⚠️</div>
            <h2>Unable to Load Resources</h2>
            <p>{error}</p>

            <button
              type="button"
              className="retry-button"
              onClick={handleRetry}
            >
              Try Again
            </button>
          </div>
        )}

        {/* RESOURCE GRID */}

        {!loading && !error && (
          <section className="resource-grid">
            {filteredResources.length > 0 ? (
              filteredResources.map((resource, index) => {
                const resourceType =
                  getResourceType(resource);

                const resourceKey =
                  resource?.id ??
                  `${resource?.title || "resource"}-${index}`;

                const typeClass =
                  resourceType.toLowerCase();

                return (
                  <article
                    className="resource-card"
                    key={resourceKey}
                  >
                    <div className="resource-card-top">
                      <div
                        className={`resource-type-icon ${typeClass}`}
                      >
                        {resourceType}
                      </div>

                      <span
                        className={`resource-type-badge ${typeClass}`}
                      >
                        {resourceType}
                      </span>
                    </div>

                    <h2>
                      {resource?.title || "Untitled Resource"}
                    </h2>

                    <p className="resource-subject">
                      {resource?.subject ||
                        "No subject specified"}
                    </p>

                    <div className="resource-details">
                      <div>
                        <span>Topic</span>
                        <strong>
                          {resource?.topic || "—"}
                        </strong>
                      </div>

                      <div>
                        <span>Year Level</span>
                        <strong>
                          {resource?.yearLevel || "—"}
                        </strong>
                      </div>

                      <div>
                        <span>Author</span>
                        <strong>
                          {resource?.author || "—"}
                        </strong>
                      </div>

                      <div>
                        <span>File Size</span>
                        <strong>
                          {resource?.size || "—"}
                        </strong>
                      </div>
                    </div>

                    <div className="resource-date">
                      Added{" "}
                      {formatDate(getResourceDate(resource))}
                    </div>

                    {resource?.status && !isStudent && (
                      <div className="resource-status">
                        <span>Status</span>

                        <strong
                          className={`status-${resource.status
                            .toString()
                            .toLowerCase()}`}
                        >
                          {resource.status}
                        </strong>
                      </div>
                    )}

                    <div className="resource-actions">
                      <button
                        type="button"
                        className="view-resource-button"
                        onClick={() =>
                          setSelectedResource(resource)
                        }
                      >
                        View
                      </button>

                      <button
                        type="button"
                        className="download-resource-button"
                        onClick={() =>
                          void handleDownload(resource)
                        }
                        disabled={
                          downloadingId === resource.id
                        }
                      >
                        {downloadingId === resource.id
                          ? "Downloading..."
                          : "Download"}
                      </button>

                      {canDelete && (
                        <button
                          type="button"
                          className="delete-resource-button"
                          onClick={() =>
                            void handleDelete(resource)
                          }
                          disabled={
                            deletingId === resource.id
                          }
                        >
                          {deletingId === resource.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="no-resources">
                <div className="empty-icon">🔎</div>
                <h2>No resources found</h2>
                <p>
                  Try changing your search or filters.
                </p>

                <button
                  type="button"
                  className="retry-button"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="resources-footer">
        © 2026 RLearn Hub — Rosemont Hills Montessori College
      </footer>
    </div>
  );
}

export default Resources;