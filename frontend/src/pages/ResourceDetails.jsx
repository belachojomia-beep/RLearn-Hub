import { useState } from "react";
import "./ResourceDetails.css";

const API_URL = "http://localhost:8080";
const SCHOOL_LOGO = "/rosemont-hills-logo.png";

/* =========================================================
   GET JWT TOKEN
========================================================= */

const getToken = () => {
  const sessionToken = sessionStorage.getItem("rlearnhub_token");
  const localToken = localStorage.getItem("rlearnhub_token");

  const token = sessionToken || localToken;

  if (!token) {
    throw new Error(
      "Authentication token not found. Please log in again."
    );
  }

  return token;
};

/* =========================================================
   FORMAT DATE
========================================================= */

const formatDate = (value) => {
  if (!value) return "—";

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
   COMPONENT
========================================================= */

function ResourceDetails({
  resource,
  user,
  onBackToResources,
}) {
  const [viewing, setViewing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  /* =======================================================
     RESOURCE VALIDATION
  ======================================================= */

  if (!resource) {
    return (
      <div className="resource-details-page">
        <header className="resource-details-header">
          <div className="resource-details-brand">
            <img
              src={SCHOOL_LOGO}
              alt="Rosemont Hills Montessori College"
              className="resource-details-logo"
            />

            <div>
              <h1>RLearn Hub</h1>
              <p>Resource Details</p>
            </div>
          </div>

          <button
            type="button"
            className="resource-details-back"
            onClick={onBackToResources}
          >
            ← Back to Resources
          </button>
        </header>

        <main className="resource-details-container">
          <section className="resource-details-card resource-not-found">
            <div className="not-found-icon">!</div>

            <h2>Resource Not Found</h2>

            <p>
              The requested learning resource could not be found.
            </p>

            <button
              type="button"
              className="resource-view-button"
              onClick={onBackToResources}
            >
              ← Back to Resource Library
            </button>
          </section>
        </main>

        <footer className="resource-details-footer">
          © 2026 RLearn Hub — Rosemont Hills Montessori College
        </footer>
      </div>
    );
  }

  /* =======================================================
     RESOURCE DATA
  ======================================================= */

  const resourceId = resource.id;

  const viewUrl =
    `${API_URL}/api/resources/${resourceId}/file`;

  const downloadUrl =
    `${API_URL}/api/resources/${resourceId}/download?email=${encodeURIComponent(
      user?.email || ""
    )}`;

  /* =======================================================
     VIEW RESOURCE
  ======================================================= */

  const handleView = async () => {
    if (!resourceId) {
      alert("This resource does not have a valid ID.");
      return;
    }

    const newWindow = window.open("", "_blank");

    if (!newWindow) {
      alert(
        "The browser blocked the resource window. Please allow pop-ups for localhost."
      );
      return;
    }

    try {
      setViewing(true);

      const token = getToken();

      const response = await fetch(viewUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "*/*",
        },
      });

      if (!response.ok) {
        let message =
          `Unable to view resource. Status: ${response.status}`;

        try {
          const contentType =
            response.headers.get("content-type");

          if (
            contentType?.includes("application/json")
          ) {
            const errorData = await response.json();

            if (errorData?.message) {
              message = errorData.message;
            }
          } else {
            const text = await response.text();

            if (text) {
              message = text;
            }
          }
        } catch {
          // Keep default error message
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      const blobUrl =
        window.URL.createObjectURL(blob);

      newWindow.location.href = blobUrl;

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (error) {
      console.error(
        "View resource error:",
        error
      );

      try {
        newWindow.close();
      } catch {
        // Ignore
      }

      alert(
        error?.message ||
          "Unable to view this resource."
      );
    } finally {
      setViewing(false);
    }
  };

  /* =======================================================
     DOWNLOAD RESOURCE
  ======================================================= */

  const handleDownload = async () => {
    if (!resourceId) {
      alert("This resource does not have a valid ID.");
      return;
    }

    if (!user?.email) {
      alert(
        "User email is required to download this resource."
      );
      return;
    }

    try {
      setDownloading(true);

      const token = getToken();

      const response = await fetch(downloadUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "*/*",
        },
      });

      if (!response.ok) {
        let message =
          `Download failed. Status: ${response.status}`;

        try {
          const contentType =
            response.headers.get("content-type");

          if (
            contentType?.includes("application/json")
          ) {
            const errorData =
              await response.json();

            if (errorData?.message) {
              message = errorData.message;
            }
          } else {
            const text = await response.text();

            if (text) {
              message = text;
            }
          }
        } catch {
          // Keep default error message
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      /* =================================================
         DETERMINE FILE NAME
      ================================================= */

      let fileName =
        resource.fileName ||
        resource.title ||
        "resource";

      const contentDisposition =
        response.headers.get(
          "Content-Disposition"
        );

      if (contentDisposition) {
        const match =
          contentDisposition.match(
            /filename\*=(?:UTF-8'')?([^;]+)|filename="?([^"]+)"?/i
          );

        if (match) {
          const rawFileName =
            match[1] || match[2];

          if (rawFileName) {
            try {
              fileName =
                decodeURIComponent(
                  rawFileName
                    .trim()
                    .replace(
                      /^["']|["']$/g,
                      ""
                    )
                );
            } catch {
              fileName =
                rawFileName
                  .trim()
                  .replace(
                    /^["']|["']$/g,
                    ""
                  );
            }
          }
        }
      }

      /* =================================================
         ADD FILE EXTENSION
      ================================================= */

      if (
        !fileName.includes(".") &&
        resource.type
      ) {
        fileName =
          `${fileName}.${resource.type
            .toString()
            .toLowerCase()}`;
      }

      /* =================================================
         CREATE DOWNLOAD
      ================================================= */

      const blobUrl =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = blobUrl;
      link.download = fileName;
      link.style.display = "none";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (error) {
      console.error(
        "Download resource error:",
        error
      );

      alert(
        error?.message ||
          "Unable to download this resource."
      );
    } finally {
      setDownloading(false);
    }
  };

  /* =======================================================
     FILE TYPE
  ======================================================= */

  const fileType =
    resource.type?.toString().toUpperCase() ||
    "FILE";

  const fileTypeClass =
    resource.type?.toString().toLowerCase() ||
    "file";

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="resource-details-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="resource-details-header">

        <div className="resource-details-brand">

          <img
            src={SCHOOL_LOGO}
            alt="Rosemont Hills Montessori College"
            className="resource-details-logo"
          />

          <div className="resource-details-brand-text">
            <h1>RLearn Hub</h1>

            <p>
              Resource Library
            </p>
          </div>

        </div>

        <button
          type="button"
          className="resource-details-back"
          onClick={onBackToResources}
        >
          ← Back to Resources
        </button>

      </header>

      {/* =================================================
          CONTENT
      ================================================= */}

      <main className="resource-details-container">

        <section className="resource-details-card">

          {/* =================================================
              RESOURCE TOP
          ================================================= */}

          <div className="resource-details-top">

            <div
              className={`resource-file-icon ${fileTypeClass}`}
            >
              {fileType}
            </div>

            <div className="resource-details-heading">

              <span className="resource-details-label">
                LEARNING RESOURCE
              </span>

              <h2>
                {resource.title ||
                  "Untitled Resource"}
              </h2>

              <p className="resource-details-subject">
                {resource.subject || "No subject specified"}
              </p>

            </div>

          </div>

          {/* =================================================
              RESOURCE INFORMATION
          ================================================= */}

          <div className="resource-information-grid">

            <div className="resource-information-item">
              <span>Topic</span>

              <strong>
                {resource.topic || "—"}
              </strong>
            </div>

            <div className="resource-information-item">
              <span>Year Level</span>

              <strong>
                {resource.yearLevel || "—"}
              </strong>
            </div>

            <div className="resource-information-item">
              <span>Author</span>

              <strong>
                {resource.author || "—"}
              </strong>
            </div>

            <div className="resource-information-item">
              <span>File Size</span>

              <strong>
                {resource.size || "—"}
              </strong>
            </div>

            <div className="resource-information-item">
              <span>File Type</span>

              <strong>
                {fileType}
              </strong>
            </div>

            <div className="resource-information-item">
              <span>Date Added</span>

              <strong>
                {formatDate(resource.dateAdded)}
              </strong>
            </div>

          </div>

          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <div className="resource-description">

            <h3>
              About This Resource
            </h3>

            <p>
              This learning resource is available through
              the RLearn Hub Resource Library. Students can
              use this material to support their learning,
              review lessons, and study the selected topic.
            </p>

          </div>

          {/* =================================================
              ACTION BUTTONS
          ================================================= */}

          <div className="resource-details-actions">

            <button
              type="button"
              className="resource-view-button"
              onClick={handleView}
              disabled={viewing}
            >
              {viewing
                ? "Opening..."
                : "👁 View Resource"}
            </button>

            <button
              type="button"
              className="resource-download-button"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading
                ? "Downloading..."
                : "↓ Download"}
            </button>

          </div>

        </section>

      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="resource-details-footer">
        © 2026 RLearn Hub — Rosemont Hills Montessori College
      </footer>

    </div>
  );
}

export default ResourceDetails;