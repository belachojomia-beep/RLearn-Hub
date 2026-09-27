import { useState } from "react";
import "./ResourceDetails.css";

const API_URL = "http://localhost:8080";


/* =========================================================
   GET JWT TOKEN
   ========================================================= */

const getToken = () => {

  /*
   * IMPORTANT:
   * Your screenshot shows the JWT in SESSION STORAGE.
   *
   * Therefore sessionStorage is checked first.
   */

  const sessionToken =
    sessionStorage.getItem(
      "rlearnhub_token"
    );

  const localToken =
    localStorage.getItem(
      "rlearnhub_token"
    );

  const token =
    sessionToken || localToken;


  console.log(
    "ResourceDetails JWT exists:",
    !!token
  );


  if (!token) {

    throw new Error(
      "Authentication token not found. Please log in again."
    );
  }


  return token;
};


/* =========================================================
   COMPONENT
   ========================================================= */

function ResourceDetails({
  resource,
  user,
  onBackToResources
}) {

  const [viewing, setViewing] =
    useState(false);

  const [downloading, setDownloading] =
    useState(false);


  /* =======================================================
     VALIDATE RESOURCE
     ======================================================= */

  if (!resource) {

    return (
      <div className="resource-details-page">

        <main className="resource-details-container">

          <section className="resource-details-card">

            <h2>
              Resource not found
            </h2>


            <button
              type="button"
              className="resource-details-back"
              onClick={
                onBackToResources
              }
            >
              ← Back to Resources
            </button>

          </section>

        </main>

      </div>
    );
  }


  /* =======================================================
     RESOURCE URLS
     ======================================================= */

  const resourceId =
    resource.id;


  const viewUrl =
    `${API_URL}/api/resources/${resourceId}/file`;


  const downloadUrl =
    `${API_URL}/api/resources/${resourceId}/download?email=${encodeURIComponent(
      user?.email || ""
    )}`;


  /* =======================================================
     VIEW RESOURCE
     ======================================================= */

  const handleView =
    async () => {

      if (!resourceId) {

        alert(
          "This resource does not have a valid ID."
        );

        return;
      }


      /*
       * Open a blank tab immediately.
       *
       * This prevents the browser from blocking
       * the new tab after the async fetch.
       */

      const newWindow =
        window.open(
          "",
          "_blank"
        );


      if (!newWindow) {

        alert(
          "The browser blocked the resource window. Please allow pop-ups for localhost."
        );

        return;
      }


      try {

        setViewing(true);


        const token =
          getToken();


        console.log(
          "Viewing resource:",
          resourceId
        );


        const response =
          await fetch(
            viewUrl,
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
          "View response:",
          response.status
        );


        if (!response.ok) {

          let message =
            `Unable to view resource. Status: ${response.status}`;


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


        const blobUrl =
          window.URL.createObjectURL(
            blob
          );


        /*
         * Send the authenticated file
         * to the newly opened tab.
         */

        newWindow.location.href =
          blobUrl;


        /*
         * Keep the URL alive long enough
         * for the browser to display it.
         */

        setTimeout(() => {

          window.URL.revokeObjectURL(
            blobUrl
          );

        }, 60000);


      } catch (error) {

        console.error(
          "View resource error:",
          error
        );


        /*
         * Close blank tab if loading failed.
         */

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

  const handleDownload =
    async () => {

      if (!resourceId) {

        alert(
          "This resource does not have a valid ID."
        );

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


        const token =
          getToken();


        console.log(
          "Downloading resource:",
          resourceId
        );


        console.log(
          "Download URL:",
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
         * Add extension if backend didn't provide one.
         */

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

        setDownloading(false);
      }
    };


  /* =======================================================
     PAGE
     ======================================================= */

  return (

    <div className="resource-details-page">


      {/* =================================================
          HEADER
          ================================================= */}

      <header className="resource-details-header">

        <div>

          <h1>
            Resource Details
          </h1>

          <p>
            View information about this learning resource.
          </p>

        </div>


        <button
          type="button"
          className="resource-details-back"
          onClick={
            onBackToResources
          }
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
              TOP
              ================================================= */}

          <div className="resource-details-top">

            <div className="resource-file-icon">

              {resource.type ||
                "FILE"}

            </div>


            <span
              className={`resource-details-type ${
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


          {/* =================================================
              TITLE
              ================================================= */}

          <h2>

            {resource.title ||
              "Untitled Resource"}

          </h2>


          {/* =================================================
              SUBJECT
              ================================================= */}

          <p className="resource-details-subject">

            {resource.subject ||
              "—"}

          </p>


          {/* =================================================
              INFORMATION
              ================================================= */}

          <div className="resource-information-grid">


            <div className="resource-information-item">

              <span>
                Topic
              </span>

              <strong>
                {resource.topic ||
                  "—"}
              </strong>

            </div>


            <div className="resource-information-item">

              <span>
                Year Level
              </span>

              <strong>
                {resource.yearLevel ||
                  "—"}
              </strong>

            </div>


            <div className="resource-information-item">

              <span>
                Author
              </span>

              <strong>
                {resource.author ||
                  "—"}
              </strong>

            </div>


            <div className="resource-information-item">

              <span>
                File Size
              </span>

              <strong>
                {resource.size ||
                  "—"}
              </strong>

            </div>


            <div className="resource-information-item">

              <span>
                File Type
              </span>

              <strong>
                {resource.type ||
                  "—"}
              </strong>

            </div>


            <div className="resource-information-item">

              <span>
                Date Added
              </span>

              <strong>
                {resource.dateAdded ||
                  "—"}
              </strong>

            </div>

          </div>


          {/* =================================================
              DESCRIPTION
              ================================================= */}

          <div className="resource-description">

            <h3>
              About this Resource
            </h3>

            <p>
              This learning resource is available through
              the RLearn Hub Resource Library. Students can
              use this material to support their learning
              and review the selected topic.
            </p>

          </div>


          {/* =================================================
              ACTION BUTTONS
              ================================================= */}

          <div className="resource-details-actions">


            {/* VIEW */}

            <button
              type="button"
              className="resource-view-button"
              onClick={
                handleView
              }
              disabled={
                viewing
              }
            >

              {viewing
                ? "Opening..."
                : "👁 View Resource"}

            </button>


            {/* DOWNLOAD */}

            <button
              type="button"
              className="resource-download-button"
              onClick={
                handleDownload
              }
              disabled={
                downloading
              }
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

        © 2026 RLearn Hub —
        Rosemont Hills Montessori College

      </footer>

    </div>
  );
}


export default ResourceDetails;