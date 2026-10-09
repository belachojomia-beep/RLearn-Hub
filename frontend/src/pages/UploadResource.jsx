import { useState } from "react";
import "./UploadResource.css";

const API_URL = "http://localhost:8080";
const SCHOOL_LOGO = "/rosemont-hills-logo.png";

function UploadResource({ onBackToDashboard }) {

  // =========================================================
  // FORM DATA
  // =========================================================

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [yearLevel, setYearLevel] = useState("First Year");
  const [author, setAuthor] = useState("");
  const [dateAdded, setDateAdded] = useState("");
  const [file, setFile] = useState(null);

  // =========================================================
  // STATUS
  // =========================================================

  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // ALLOWED FILE TYPES
  // =========================================================

  const allowedExtensions = [
    "pdf",
    "doc",
    "docx",
    "ppt",
    "pptx",
    "mp4",
    "webm",
    "mov",
    "avi",
    "mkv",
  ];

  const allowedFileTypes = [
    ".pdf",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
    ".mp4",
    ".webm",
    ".mov",
    ".avi",
    ".mkv",
  ].join(",");

  const maxFileSize = 50 * 1024 * 1024;

  // =========================================================
  // GET JWT TOKEN
  // =========================================================

  const getToken = () => {
    const sessionToken =
      sessionStorage.getItem("rlearnhub_token");

    const localToken =
      localStorage.getItem("rlearnhub_token");

    return sessionToken || localToken;
  };

  // =========================================================
  // FILE SIZE FORMAT
  // =========================================================

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // =========================================================
  // GET FILE EXTENSION
  // =========================================================

  const getFileExtension = (fileName) => {
    const dotIndex = fileName.lastIndexOf(".");

    if (dotIndex === -1) {
      return "";
    }

    return fileName
      .substring(dotIndex + 1)
      .toLowerCase();
  };

  // =========================================================
  // FILE TYPE LABEL
  // =========================================================

  const getFileTypeLabel = (extension) => {
    switch (extension) {
      case "pdf":
        return "PDF Document";

      case "doc":
      case "docx":
        return "Word Document";

      case "ppt":
      case "pptx":
        return "PowerPoint Presentation";

      case "mp4":
      case "webm":
      case "mov":
      case "avi":
      case "mkv":
        return "Video";

      default:
        return "File";
    }
  };

  // =========================================================
  // FILE SELECTION
  // =========================================================

  const handleFileChange = (event) => {
    const selectedFile =
      event.target.files?.[0];

    setSuccess("");
    setError("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // -------------------------------------------------------
    // CHECK FILE EXTENSION
    // -------------------------------------------------------

    const extension =
      getFileExtension(selectedFile.name);

    if (!allowedExtensions.includes(extension)) {
      setFile(null);

      event.target.value = "";

      setError(
        "Unsupported file type. Please select PDF, DOC, DOCX, PPT, PPTX, or a supported video file."
      );

      return;
    }

    // -------------------------------------------------------
    // CHECK FILE SIZE
    // -------------------------------------------------------

    if (selectedFile.size > maxFileSize) {
      setFile(null);

      event.target.value = "";

      setError(
        "File is too large. The maximum file size is 50 MB."
      );

      return;
    }

    // -------------------------------------------------------
    // ACCEPT FILE
    // -------------------------------------------------------

    setFile(selectedFile);
  };

  // =========================================================
  // UPLOAD RESOURCE
  // =========================================================

  const handleUpload = async (event) => {
    event.preventDefault();

    setSuccess("");
    setError("");

    // -------------------------------------------------------
    // VALIDATE REQUIRED FIELDS
    // -------------------------------------------------------

    if (
      !title.trim() ||
      !subject.trim() ||
      !topic.trim() ||
      !yearLevel ||
      !author.trim() ||
      !dateAdded ||
      !file
    ) {
      setError(
        "Please complete all fields and select a file."
      );

      return;
    }

    // -------------------------------------------------------
    // VALIDATE FILE
    // -------------------------------------------------------

    const extension =
      getFileExtension(file.name);

    if (!allowedExtensions.includes(extension)) {
      setError("Unsupported file type.");
      return;
    }

    if (file.size > maxFileSize) {
      setError(
        "File is too large. The maximum file size is 50 MB."
      );

      return;
    }

    // -------------------------------------------------------
    // GET TOKEN
    // -------------------------------------------------------

    const token = getToken();

    if (!token) {
      setError(
        "Your login session has expired. Please log in again."
      );

      return;
    }

    try {
      setUploading(true);

      // -----------------------------------------------------
      // CREATE FORM DATA
      // -----------------------------------------------------

      const formData = new FormData();

      formData.append(
        "file",
        file
      );

      formData.append(
        "title",
        title.trim()
      );

      formData.append(
        "subject",
        subject.trim()
      );

      formData.append(
        "topic",
        topic.trim()
      );

      formData.append(
        "yearLevel",
        yearLevel
      );

      formData.append(
        "author",
        author.trim()
      );

      formData.append(
        "dateAdded",
        dateAdded
      );

      // -----------------------------------------------------
      // DEBUG INFORMATION
      // -----------------------------------------------------

      console.log("=== RLEARN HUB RESOURCE UPLOAD ===");
      console.log("Title:", title.trim());
      console.log("Subject:", subject.trim());
      console.log("Topic:", topic.trim());
      console.log("Year Level:", yearLevel);
      console.log("Author:", author.trim());
      console.log("Date Added:", dateAdded);
      console.log("File:", file.name);
      console.log("File Size:", formatFileSize(file.size));
      console.log("File Type:", extension);
      console.log("Token exists:", !!token);

      // -----------------------------------------------------
      // SEND TO API GATEWAY
      // -----------------------------------------------------

      const response = await fetch(
        `${API_URL}/api/resources/upload`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          body: formData,
        }
      );

      // -----------------------------------------------------
      // READ SERVER RESPONSE
      // -----------------------------------------------------

      const responseText =
        await response.text();

      console.log(
        "Upload response:",
        response.status,
        responseText
      );

      // -----------------------------------------------------
      // HANDLE SERVER ERROR
      // -----------------------------------------------------

      if (!response.ok) {
        throw new Error(
          responseText ||
          `Unable to upload the resource. Status: ${response.status}`
        );
      }

      // -----------------------------------------------------
      // PARSE RESPONSE
      // -----------------------------------------------------

      let uploadedResource = null;

      if (responseText) {
        try {
          uploadedResource =
            JSON.parse(responseText);
        } catch {
          uploadedResource = null;
        }
      }

      console.log(
        "Uploaded resource:",
        uploadedResource
      );

      // -----------------------------------------------------
      // SUCCESS
      // -----------------------------------------------------

      setSuccess(
        "Resource uploaded successfully!"
      );

      // -----------------------------------------------------
      // CLEAR FORM
      // -----------------------------------------------------

      setTitle("");
      setSubject("");
      setTopic("");
      setYearLevel("First Year");
      setAuthor("");
      setDateAdded("");
      setFile(null);

      // -----------------------------------------------------
      // RESET FILE INPUT
      // -----------------------------------------------------

      const fileInput =
        document.getElementById(
          "resource-file"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      // Scroll to success message
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    } catch (uploadError) {
      console.error(
        "Upload resource error:",
        uploadError
      );

      setError(
        uploadError?.message ||
        "Unable to upload the resource."
      );

    } finally {
      setUploading(false);
    }
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="upload-resource-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="upload-resource-header">

        <div className="upload-header-brand">

          <img
            src={SCHOOL_LOGO}
            alt="Rosemont Hills Montessori College Logo"
            className="upload-school-logo"
          />

          <div className="upload-header-brand-text">

            <h1>
              RLearn Hub
            </h1>

            <p>
              Teacher Resource Management
            </p>

          </div>

        </div>

        <button
          type="button"
          className="upload-back-button"
          onClick={onBackToDashboard}
          disabled={uploading}
        >
          ← Back to Dashboard
        </button>

      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="upload-resource-container">

        <form
          className="upload-resource-card"
          onSubmit={handleUpload}
        >

          {/* =================================================
              PAGE TITLE
          ================================================= */}

          <div className="upload-section-title">

            <div className="upload-section-icon">
              ↑
            </div>

            <div>

              <h2>
                Upload Learning Resource
              </h2>

              <p>
                Add a learning material to the
                RLearn Hub Resource Library.
              </p>

            </div>

          </div>


          {/* =================================================
              SUCCESS MESSAGE
          ================================================= */}

          {success && (
            <div
              className="upload-success-message"
              role="status"
              aria-live="polite"
            >
              ✓ {success}
            </div>
          )}


          {/* =================================================
              ERROR MESSAGE
          ================================================= */}

          {error && (
            <div
              className="upload-error-message"
              role="alert"
              aria-live="assertive"
            >
              ⚠ {error}
            </div>
          )}


          {/* =================================================
              FORM GRID
          ================================================= */}

          <div className="upload-form-grid">

            {/* RESOURCE TITLE */}

            <div className="upload-form-group">

              <label htmlFor="resource-title">
                Resource Title
              </label>

              <input
                id="resource-title"
                name="title"
                type="text"
                placeholder="Enter resource title"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                disabled={uploading}
                required
              />

            </div>


            {/* SUBJECT */}

            <div className="upload-form-group">

              <label htmlFor="resource-subject">
                Subject
              </label>

              <input
                id="resource-subject"
                name="subject"
                type="text"
                placeholder="Enter subject"
                value={subject}
                onChange={(event) =>
                  setSubject(event.target.value)
                }
                disabled={uploading}
                required
              />

            </div>


            {/* TOPIC */}

            <div className="upload-form-group">

              <label htmlFor="resource-topic">
                Topic
              </label>

              <input
                id="resource-topic"
                name="topic"
                type="text"
                placeholder="Enter topic"
                value={topic}
                onChange={(event) =>
                  setTopic(event.target.value)
                }
                disabled={uploading}
                required
              />

            </div>


            {/* YEAR LEVEL */}

            <div className="upload-form-group">

              <label htmlFor="resource-year">
                Year Level
              </label>

              <select
                id="resource-year"
                name="yearLevel"
                value={yearLevel}
                onChange={(event) =>
                  setYearLevel(event.target.value)
                }
                disabled={uploading}
                required
              >
                <option value="First Year">
                  First Year
                </option>

                <option value="Second Year">
                  Second Year
                </option>

                <option value="Third Year">
                  Third Year
                </option>

                <option value="Fourth Year">
                  Fourth Year
                </option>
              </select>

            </div>


            {/* INSTRUCTOR */}

            <div className="upload-form-group">

              <label htmlFor="resource-author">
                Instructor
              </label>

              <input
                id="resource-author"
                name="author"
                type="text"
                placeholder="Enter instructor name"
                value={author}
                onChange={(event) =>
                  setAuthor(event.target.value)
                }
                disabled={uploading}
                required
              />

            </div>


            {/* DATE */}

            <div className="upload-form-group">

              <label htmlFor="resource-date">
                Date Added
              </label>

              <input
                id="resource-date"
                name="dateAdded"
                type="date"
                value={dateAdded}
                onChange={(event) =>
                  setDateAdded(event.target.value)
                }
                disabled={uploading}
                required
              />

            </div>

          </div>


          {/* =================================================
              FILE UPLOAD
          ================================================= */}

          <div className="upload-file-section">

            <label htmlFor="resource-file">
              Learning Material
            </label>

            <div className="upload-file-box">

              <div className="upload-file-icon">
                📁
              </div>

              {file ? (
                <>
                  <h3>
                    {file.name}
                  </h3>

                  <p className="selected-file-type">
                    {getFileTypeLabel(
                      getFileExtension(file.name)
                    )}

                    {" • "}

                    {formatFileSize(file.size)}
                  </p>
                </>
              ) : (
                <>
                  <h3>
                    Select a learning material
                  </h3>

                  <p>
                    PDF, DOC, DOCX, PPT, PPTX,
                    or video
                  </p>
                </>
              )}

              <input
                id="resource-file"
                name="file"
                type="file"
                accept={allowedFileTypes}
                onChange={handleFileChange}
                disabled={uploading}
              />

              <label
                htmlFor="resource-file"
                className="select-file-button"
              >
                {file
                  ? "Choose Another File"
                  : "Select File"}
              </label>

              <div className="file-upload-info">

                <span>
                  Maximum file size:
                  {" "}
                  <strong>50 MB</strong>
                </span>

                <span>
                  Accepted:
                  {" "}
                  PDF • DOC • DOCX • PPT • PPTX • Video
                </span>

              </div>

            </div>

          </div>


          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="upload-actions">

            <button
              type="button"
              className="upload-cancel-button"
              onClick={onBackToDashboard}
              disabled={uploading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="upload-submit-button"
              disabled={
                uploading ||
                !title.trim() ||
                !subject.trim() ||
                !topic.trim() ||
                !author.trim() ||
                !dateAdded ||
                !file
              }
            >
              {uploading
                ? "Uploading..."
                : "Upload Resource"}
            </button>

          </div>

        </form>

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="upload-resource-footer">
        © 2026 RLearn Hub — Rosemont Hills Montessori College
      </footer>

    </div>
  );
}

export default UploadResource;
