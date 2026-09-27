import { useState } from "react";
import "./UploadResource.css";

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
  // FILE SIZE FORMAT
  // =========================================================

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // =========================================================
  // FILE TYPE
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
      event.target.files[0];

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
    // CHECK REQUIRED FIELDS
    // -------------------------------------------------------

    if (
      !title.trim() ||
      !subject ||
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
    // CHECK FILE AGAIN
    // -------------------------------------------------------

    const extension =
      getFileExtension(file.name);

    if (!allowedExtensions.includes(extension)) {

      setError(
        "Unsupported file type."
      );

      return;
    }

    if (file.size > maxFileSize) {

      setError(
        "File is too large. The maximum file size is 50 MB."
      );

      return;
    }

    try {

      setUploading(true);

      // -----------------------------------------------------
      // CREATE FORM DATA
      // -----------------------------------------------------

      const formData =
        new FormData();

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
        subject
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
      // SEND TO SPRING BOOT
      // -----------------------------------------------------

          const token = sessionStorage.getItem("rlearnhub_token");

      if (!token) {
        throw new Error("Please log in again. Authentication token is missing.");
      }
      console.log("=== UPLOAD STARTED ===");
      console.log("Title:", title);
      console.log("Subject:", subject);
      console.log("Topic:", topic);
      console.log("Year Level:", yearLevel);
      console.log("Author:", author);
      console.log("Date Added:", dateAdded);
      console.log("File:", file);
      console.log("Token exists:", !!token);

            const response = await fetch(
        "http://localhost:8080/api/resources/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      // -----------------------------------------------------
      // HANDLE SERVER ERROR
      // -----------------------------------------------------

      if (!response.ok) {

        let errorMessage =
          "Unable to upload the resource.";

        try {

          const serverMessage =
            await response.text();

          if (serverMessage) {
            errorMessage =
              serverMessage;
          }

        } catch {
          // Keep default error
        }

        throw new Error(
          errorMessage
        );
      }

      // -----------------------------------------------------
      // GET UPLOADED RESOURCE
      // -----------------------------------------------------

      const uploadedResource =
        await response.json();

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
      setSubject(
        "Information Technology"
      );
      setTopic("");
      setYearLevel("First Year");
      setAuthor("");
      setDateAdded("");
      setFile(null);

      // Reset file input
      const fileInput =
        document.getElementById(
          "resource-file"
        );

      if (fileInput) {
        fileInput.value = "";
      }

    } catch (uploadError) {

      console.error(
        "Upload error:",
        uploadError
      );

      setError(
        uploadError.message ||
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
            src="/rosemont-hills-logo.png"
            alt="Rosemont Hills Montessori College Logo"
            className="upload-school-logo"
          />

          <div>
            <h1>
              RLearn Hub
            </h1>

            <p>
              Teacher Resource Management
            </p>
          </div>

        </div>

        <button
          className="upload-back-button"
          onClick={onBackToDashboard}
          type="button"
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
                Add a learning material to the RLearn Hub Resource Library.
              </p>

            </div>

          </div>

          {/* =================================================
              SUCCESS MESSAGE
          ================================================= */}

          {success && (

            <div className="upload-success-message">
              ✓ {success}
            </div>

          )}

          {/* =================================================
              ERROR MESSAGE
          ================================================= */}

          {error && (

            <div className="upload-error-message">
              ⚠ {error}
            </div>

          )}

          {/* =================================================
              FORM
          ================================================= */}

          <div className="upload-form-grid">

            {/* TITLE */}

            <div className="upload-form-group">

              <label htmlFor="resource-title">
                Resource Title
              </label>

              <input
                id="resource-title"
                type="text"
                placeholder="Enter resource title"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
              />

            </div>

            {/* SUBJECT */}


            <div className="upload-form-group">

              <label htmlFor="resource-subject">
              Subject
              </label>

              <input
                id="resource-subject"
                type="text"
                placeholder="Enter subject"
                value={subject}
                onChange={(event) =>
                  setSubject(event.target.value)
                }
              />

            </div>

            {/* TOPIC */}

            <div className="upload-form-group">

              <label htmlFor="resource-topic">
                Topic
              </label>

              <input
                id="resource-topic"
                type="text"
                placeholder="Enter topic"
                value={topic}
                onChange={(event) =>
                  setTopic(event.target.value)
                }
              />

            </div>

            {/* YEAR LEVEL */}

            <div className="upload-form-group">

              <label htmlFor="resource-year">
                Year Level
              </label>

              <select
                id="resource-year"
                value={yearLevel}
                onChange={(event) =>
                  setYearLevel(event.target.value)
                }
              >

                <option>
                  First Year
                </option>

                <option>
                  Second Year
                </option>

                <option>
                  Third Year
                </option>

                <option>
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
              type="text"
              placeholder="Enter instructor name"
              value={author}
              onChange={(event) =>
                setAuthor(event.target.value)
              }
            />

          </div>

            {/* DATE */}

            <div className="upload-form-group">

              <label htmlFor="resource-date">
                Date Added
              </label>

              <input
                id="resource-date"
                type="date"
                value={dateAdded}
                onChange={(event) =>
                  setDateAdded(event.target.value)
                }
              />

            </div>

          </div>

          {/* =================================================
              FILE UPLOAD
          ================================================= */}

          <div className="upload-file-section">

            <label>
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
                    PDF, DOC, DOCX, PPT, PPTX, or video
                  </p>
                </>

              )}

              <input
                id="resource-file"
                type="file"
                accept={allowedFileTypes}
                onChange={handleFileChange}
              />

              <label
                htmlFor="resource-file"
                className="select-file-button"
              >
                {file
                  ? "Choose Another File"
                  : "Select File"
                }
              </label>

              <div className="file-upload-info">

                <span>
                  Maximum file size: <strong>50 MB</strong>
                </span>

                <span>
                  Accepted: PDF • DOC • DOCX • PPT • PPTX • Video
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
              disabled={uploading}
            >

              {uploading
                ? "Uploading..."
                : "Upload Resource"
              }

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