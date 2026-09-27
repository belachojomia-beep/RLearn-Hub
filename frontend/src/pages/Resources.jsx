import { useEffect, useMemo, useState } from "react";
import "./Resources.css";
import ResourceDetails from "./ResourceDetails";

const API_URL = "http://localhost:8080";

/* =========================================================
   AUTHENTICATION
   ========================================================= */

const getToken = () => {
  /*
   * Your screenshot shows rlearnhub_token inside
   * SESSION STORAGE.
   *
   * We check sessionStorage FIRST.
   * localStorage is also checked as a fallback.
   */

  const sessionToken =
    sessionStorage.getItem("rlearnhub_token");

  const localToken =
    localStorage.getItem("rlearnhub_token");

  const token =
    sessionToken || localToken;

  console.log(
    "JWT exists:",
    !!token
  );

  console.log(
    "JWT length:",
    token?.length || 0
  );

  if (!token) {
    throw new Error(
      "Authentication token not found. Please log in again."
    );
  }

  return token;
};


/* =========================================================
   AUTH HEADERS
   ========================================================= */

const getAuthHeaders = () => {
  const token = getToken();

  return {
    Authorization: `Bearer ${token}`,
  };
};


/* =========================================================
   COMPONENT
   ========================================================= */

function Resources({
  user,
  onBackToDashboard
}) {

  /* =======================================================
     FILTER STATES
     ======================================================= */

  const [search, setSearch] =
    useState("");

  const [subject, setSubject] =
    useState("All Subjects");

  const [yearLevel, setYearLevel] =
    useState("All Year Levels");

  const [topic, setTopic] =
    useState("All Topics");


  /* =======================================================
     RESOURCE STATES
     ======================================================= */

  const [resources, setResources] =
    useState([]);

  const [selectedResource, setSelectedResource] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [deletingId, setDeletingId] =
    useState(null);

  const [downloadingId, setDownloadingId] =
    useState(null);


  /* =======================================================
     USER ROLE
     ======================================================= */

  const userRole =
    user?.role?.toString().toUpperCase();

  const isTeacher =
    userRole === "TEACHER";

  const isAdmin =
    userRole === "ADMIN";

  const canDelete =
    isTeacher || isAdmin;


  /* =======================================================
     LOAD RESOURCES
     ======================================================= */

  const loadResources = async () => {

    try {

      setLoading(true);
      setError("");

      console.log(
        "Loading resources..."
      );

      const headers =
        getAuthHeaders();

      const response =
        await fetch(
          `${API_URL}/api/resources`,
          {
            method: "GET",
            headers: {
              ...headers,
              Accept:
                "application/json",
            },
          }
        );

      console.log(
        "Resources response:",
        response.status
      );

      if (!response.ok) {

        let message =
          `Failed to load resources. Status: ${response.status}`;

        try {

          const contentType =
            response.headers.get(
              "content-type"
            );

          if (
            contentType?.includes(
              "application/json"
            )
          ) {

            const errorData =
              await response.json();

            if (
              errorData?.message
            ) {
              message =
                errorData.message;
            }

          } else {

            const text =
              await response.text();

            if (text) {
              message = text;
            }
          }

        } catch {
          // Keep default error
        }

        throw new Error(message);
      }


      const data =
        await response.json();

      console.log(
        "Resources received:",
        data
      );


      if (Array.isArray(data)) {

        setResources(data);

      } else if (
        Array.isArray(data?.content)
      ) {

        /*
         * Supports Spring Boot Page response
         * if the backend returns:
         *
         * {
         *   content: [...]
         * }
         */

        setResources(
          data.content
        );

      } else {

        setResources([]);
      }

    } catch (error) {

      console.error(
        "Error loading resources:",
        error
      );

      setResources([]);

      setError(
        error?.message ||
        "Unable to load resources from the server."
      );

    } finally {

      setLoading(false);
    }
  };


  /* =======================================================
     LOAD ON PAGE OPEN
     ======================================================= */

  useEffect(() => {

    loadResources();

  }, []);


  /* =======================================================
     SUBJECT OPTIONS
     ======================================================= */

  const subjectOptions =
    useMemo(() => {

      const values =
        resources
          .map(
            resource =>
              resource?.subject
          )
          .filter(Boolean);

      return [
        ...new Set(values)
      ].sort();

    }, [resources]);


  /* =======================================================
     YEAR LEVEL OPTIONS
     ======================================================= */

  const yearLevelOptions =
    useMemo(() => {

      const values =
        resources
          .map(
            resource =>
              resource?.yearLevel
          )
          .filter(Boolean);

      return [
        ...new Set(values)
      ].sort();

    }, [resources]);


  /* =======================================================
     TOPIC OPTIONS
     ======================================================= */

  const topicOptions =
    useMemo(() => {

      const values =
        resources
          .map(
            resource =>
              resource?.topic
          )
          .filter(Boolean);

      return [
        ...new Set(values)
      ].sort();

    }, [resources]);


  /* =======================================================
     FILTER RESOURCES
     ======================================================= */

  const filteredResources =
    resources.filter(
      resource => {

        const searchText =
          search
            .trim()
            .toLowerCase();


        const title =
          resource?.title
            ?.toString()
            .toLowerCase() || "";


        const resourceSubject =
          resource?.subject
            ?.toString()
            .toLowerCase() || "";


        const resourceTopic =
          resource?.topic
            ?.toString()
            .toLowerCase() || "";


        const resourceAuthor =
          resource?.author
            ?.toString()
            .toLowerCase() || "";


        const matchesSearch =
          searchText === "" ||
          title.includes(searchText) ||
          resourceSubject.includes(
            searchText
          ) ||
          resourceTopic.includes(
            searchText
          ) ||
          resourceAuthor.includes(
            searchText
          );


        const matchesSubject =
          subject === "All Subjects" ||
          resource?.subject === subject;


        const matchesYear =
          yearLevel === "All Year Levels" ||
          resource?.yearLevel ===
            yearLevel;


        const matchesTopic =
          topic === "All Topics" ||
          resource?.topic === topic;


        return (
          matchesSearch &&
          matchesSubject &&
          matchesYear &&
          matchesTopic
        );
      }
    );


  /* =======================================================
     DOWNLOAD RESOURCE
     ======================================================= */

  const handleDownload =
    async resource => {

      if (!resource?.id) {

        alert(
          "This resource does not have a valid ID."
        );

        return;
      }


      if (!user?.email) {

        alert(
          "Your account information is missing. Please log in again."
        );

        return;
      }


      try {

        setDownloadingId(
          resource.id
        );


        const token =
          getToken();


        const downloadUrl =
          `${API_URL}/api/resources/${resource.id}/download?email=${encodeURIComponent(
            user.email
          )}`;


        console.log(
          "Downloading:",
          downloadUrl
        );


        const response =
          await fetch(
            downloadUrl,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,

                Accept:
                  "*/*",
              },
            }
          );


        console.log(
          "Download response:",
          response.status
        );


        if (!response.ok) {

          let message =
            `Download failed. Status: ${response.status}`;


          try {

            const contentType =
              response.headers.get(
                "content-type"
              );


            if (
              contentType?.includes(
                "application/json"
              )
            ) {

              const errorData =
                await response.json();

              if (
                errorData?.message
              ) {

                message =
                  errorData.message;
              }

            } else {

              const text =
                await response.text();

              if (text) {
                message = text;
              }
            }

          } catch {
            // Keep default message
          }


          throw new Error(message);
        }


        const blob =
          await response.blob();


        /*
         * Try to get filename from backend.
         */

        let fileName =
          resource?.fileName ||
          resource?.title ||
          "resource";


        const contentDisposition =
          response.headers.get(
            "Content-Disposition"
          );


        if (
          contentDisposition
        ) {

          const match =
            contentDisposition.match(
              /filename\*=(?:UTF-8'')?([^;]+)|filename="?([^"]+)"?/i
            );


          if (match) {

            const rawFileName =
              match[1] ||
              match[2];


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


        /*
         * Add extension if necessary.
         */

        if (
          !fileName.includes(".") &&
          resource?.type
        ) {

          fileName =
            `${fileName}.${resource.type
              .toString()
              .toLowerCase()}`;
        }


        /*
         * Create download URL.
         */

        const blobUrl =
          window.URL.createObjectURL(
            blob
          );


        const link =
          document.createElement(
            "a"
          );


        link.href =
          blobUrl;

        link.download =
          fileName;

        link.style.display =
          "none";


        document.body.appendChild(
          link
        );


        link.click();


        document.body.removeChild(
          link
        );


        setTimeout(() => {

          window.URL.revokeObjectURL(
            blobUrl
          );

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

        setDownloadingId(
          null
        );
      }
    };


  /* =======================================================
     DELETE RESOURCE
     ======================================================= */

  const handleDelete =
    async resource => {

      if (!resource?.id) {

        alert(
          "This resource does not have a valid ID."
        );

        return;
      }


      const confirmed =
        window.confirm(
          `Are you sure you want to delete "${resource.title}"?\n\nThis action cannot be undone.`
        );


      if (!confirmed) {
        return;
      }


      try {

        setDeletingId(
          resource.id
        );


        const headers =
          getAuthHeaders();


        const response =
          await fetch(
            `${API_URL}/api/resources/${resource.id}`,
            {
              method: "DELETE",
              headers,
            }
          );


        if (!response.ok) {

          let message =
            `Failed to delete resource. Status: ${response.status}`;


          try {

            const data =
              await response.json();

            if (data?.message) {
              message =
                data.message;
            }

          } catch {
            // Keep default
          }


          throw new Error(message);
        }


        setResources(
          currentResources =>
            currentResources.filter(
              item =>
                item.id !==
                resource.id
            )
        );


        if (
          selectedResource?.id ===
          resource.id
        ) {

          setSelectedResource(
            null
          );
        }


        alert(
          `"${resource.title}" was deleted successfully.`
        );


      } catch (error) {

        console.error(
          "Delete resource error:",
          error
        );


        alert(
          error?.message ||
          "Unable to delete this resource."
        );


      } finally {

        setDeletingId(
          null
        );
      }
    };


  /* =======================================================
     CLEAR FILTERS
     ======================================================= */

  const handleClearFilters =
    () => {

      setSearch("");
      setSubject("All Subjects");
      setYearLevel(
        "All Year Levels"
      );
      setTopic("All Topics");
    };


  /* =======================================================
     RESOURCE DETAILS
     ======================================================= */

  if (selectedResource) {

    return (
      <ResourceDetails
        resource={
          selectedResource
        }

        user={user}

        onBackToResources={() => {
          setSelectedResource(
            null
          );
        }}
      />
    );
  }


  /* =======================================================
     MAIN PAGE
     ======================================================= */

  return (
    <div className="resources-page">


      {/* ===================================================
          HEADER
          =================================================== */}

      <header className="resources-header">

        <div className="resources-header-brand">

          <img
            src="/rosemont-hills-logo.png"
            alt="Rosemont Hills Montessori College Logo"
            className="resources-logo"
          />

          <div>

            <h1>
              Resource Library
            </h1>

            <p>
              Find learning materials,
              resources, and study materials.
            </p>

          </div>

        </div>


        <button
          type="button"
          className="resources-back-button"
          onClick={
            onBackToDashboard
          }
        >
          ← Back to Dashboard
        </button>

      </header>


      {/* ===================================================
          FILTERS
          =================================================== */}

      <section className="resource-filters">


        {/* SEARCH */}

        <div className="resource-search">

          <span className="search-icon">
            🔎
          </span>


          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={event =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>


        {/* SUBJECT */}

        <select
          value={subject}
          onChange={event =>
            setSubject(
              event.target.value
            )
          }
        >

          <option value="All Subjects">
            All Subjects
          </option>


          {subjectOptions.map(
            option => (

              <option
                key={option}
                value={option}
              >
                {option}
              </option>

            )
          )}

        </select>


        {/* YEAR LEVEL */}

        <select
          value={yearLevel}
          onChange={event =>
            setYearLevel(
              event.target.value
            )
          }
        >

          <option value="All Year Levels">
            All Year Levels
          </option>


          {yearLevelOptions.map(
            option => (

              <option
                key={option}
                value={option}
              >
                {option}
              </option>

            )
          )}

        </select>


        {/* TOPIC */}

        <select
          value={topic}
          onChange={event =>
            setTopic(
              event.target.value
            )
          }
        >

          <option value="All Topics">
            All Topics
          </option>


          {topicOptions.map(
            option => (

              <option
                key={option}
                value={option}
              >
                {option}
              </option>

            )
          )}

        </select>

      </section>


      {/* ===================================================
          SUMMARY
          =================================================== */}

      <div className="resource-summary">

        <div className="resource-count">

          <strong>
            {filteredResources.length}
          </strong>

          <span>
            resources found
          </span>

        </div>


        <button
          type="button"
          className="clear-filters"
          onClick={
            handleClearFilters
          }
        >
          Clear Filters
        </button>

      </div>


      {/* ===================================================
          LOADING
          =================================================== */}

      {loading && (

        <div className="no-resources">

          <div className="empty-icon">
            ⏳
          </div>

          <h2>
            Loading resources...
          </h2>

          <p>
            Please wait while the
            Resource Library loads.
          </p>

        </div>

      )}


      {/* ===================================================
          ERROR
          =================================================== */}

      {!loading && error && (

        <div className="no-resources">

          <div className="empty-icon">
            ⚠️
          </div>

          <h2>
            Unable to Load Resources
          </h2>

          <p>
            {error}
          </p>


          <button
            type="button"
            className="retry-button"
            onClick={
              loadResources
            }
          >
            Try Again
          </button>

        </div>

      )}


      {/* ===================================================
          RESOURCE CARDS
          =================================================== */}

      {!loading &&
        !error && (

          <main className="resource-grid">

            {filteredResources.length >
            0 ? (

              filteredResources.map(
                resource => (

                  <article
                    className="resource-card"
                    key={resource.id}
                  >


                    {/* CARD TOP */}

                    <div className="resource-card-top">

                      <div
                        className={`resource-type-icon ${
                          resource.type
                            ?.toString()
                            .toLowerCase() ||
                          ""
                        }`}
                      >
                        {resource.type ||
                          "FILE"}
                      </div>


                      <span
                        className={`resource-type-badge ${
                          resource.type
                            ?.toString()
                            .toLowerCase() ||
                          ""
                        }`}
                      >
                        {resource.type ||
                          "FILE"}
                      </span>

                    </div>


                    {/* TITLE */}

                    <h2>
                      {resource.title ||
                        "Untitled Resource"}
                    </h2>


                    {/* SUBJECT */}

                    <p className="resource-subject">
                      {resource.subject ||
                        "—"}
                    </p>


                    {/* INFORMATION */}

                    <div className="resource-details">


                      <div>

                        <span>
                          Topic
                        </span>

                        <strong>
                          {resource.topic ||
                            "—"}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Year Level
                        </span>

                        <strong>
                          {resource.yearLevel ||
                            "—"}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Author
                        </span>

                        <strong>
                          {resource.author ||
                            "—"}
                        </strong>

                      </div>


                      <div>

                        <span>
                          File Size
                        </span>

                        <strong>
                          {resource.size ||
                            "—"}
                        </strong>

                      </div>

                    </div>


                    {/* DATE */}

                    <div className="resource-date">

                      Added{" "}

                      {resource.dateAdded ||
                        "—"}

                    </div>


                    {/* ACTIONS */}

                    <div className="resource-actions">


                      {/* VIEW */}

                      <button
                        type="button"
                        className="view-resource-button"
                        onClick={() =>
                          setSelectedResource(
                            resource
                          )
                        }
                      >
                        View
                      </button>


                      {/* DOWNLOAD */}

                      <button
                        type="button"
                        className="download-resource-button"
                        onClick={() =>
                          handleDownload(
                            resource
                          )
                        }
                        disabled={
                          downloadingId ===
                          resource.id
                        }
                      >

                        {downloadingId ===
                        resource.id
                          ? "Downloading..."
                          : "Download"}

                      </button>


                      {/* DELETE */}

                      {canDelete && (

                        <button
                          type="button"
                          className="delete-resource-button"
                          onClick={() =>
                            handleDelete(
                              resource
                            )
                          }
                          disabled={
                            deletingId ===
                            resource.id
                          }
                        >

                          {deletingId ===
                          resource.id
                            ? "Deleting..."
                            : "Delete"}

                        </button>

                      )}

                    </div>

                  </article>

                )
              )

            ) : (

              <div className="no-resources">

                <div className="empty-icon">
                  🔎
                </div>

                <h2>
                  No resources found
                </h2>

                <p>
                  Try changing your search
                  or filters.
                </p>

              </div>

            )}

          </main>

        )}


      {/* ===================================================
          FOOTER
          =================================================== */}

      <footer className="resources-footer">

        © 2026 RLearn Hub —
        Rosemont Hills Montessori College

      </footer>

    </div>
  );
}


export default Resources;