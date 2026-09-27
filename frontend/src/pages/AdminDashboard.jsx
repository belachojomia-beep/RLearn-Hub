import React from "react";
import "./AdminDashboard.css";

const recentResources = [
  {
    id: 1,
    title: "Introduction to Programming",
    subject: "Computer Science",
    uploadedBy: "Maria Santos",
    status: "Approved",
    type: "PDF",
  },
  {
    id: 2,
    title: "Philippine History",
    subject: "History",
    uploadedBy: "John Dela Cruz",
    status: "Pending",
    type: "DOC",
  },
  {
    id: 3,
    title: "English Grammar Guide",
    subject: "English",
    uploadedBy: "Ana Reyes",
    status: "Approved",
    type: "PDF",
  },
  {
    id: 4,
    title: "Chemistry Laboratory Safety",
    subject: "Chemistry",
    uploadedBy: "Mark Garcia",
    status: "Pending",
    type: "PPT",
  },
];

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

  return (
    <div className="admin-layout">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside className="admin-sidebar">

        {/* BRAND */}

        <div className="admin-brand">

          <div className="admin-logo">
            R
          </div>

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


        {/* =================================================
            ADMIN NAVIGATION
        ================================================== */}

        <nav className="admin-navigation">

          <button
            type="button"
            className="admin-nav-item active"
          >
            Dashboard
          </button>

          <button
            type="button"
            className="admin-nav-item"
          >
            Manage Users
          </button>

          <button
            type="button"
            className="admin-nav-item"
          >
            Review Resources
          </button>

          <button
            type="button"
            className="admin-nav-item"
          >
            Reports
          </button>

          <button
            type="button"
            className="admin-nav-item"
          >
            Announcements
          </button>

        </nav>


        {/* =================================================
            LOGOUT
        ================================================== */}

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
      ====================================================== */}

      <main className="admin-main">


        {/* =================================================
            WELCOME HEADER
        ================================================== */}

        <section className="admin-welcome">

          <div>

            <span className="admin-label">
              Administration
            </span>

            <h2>
              Admin Dashboard
            </h2>

            <p>
              Manage RLearn-Hub users, resources,
              announcements, and system activities.
            </p>

          </div>


          {/* SYSTEM STATUS */}

          <div className="admin-status">

            <span className="admin-status-dot"></span>

            System Online

          </div>

        </section>


        {/* =================================================
            STATISTICS
        ================================================== */}

        <section className="admin-statistics">


          {/* TOTAL RESOURCES */}

          <div className="admin-stat-card">

            <div className="admin-stat-top">

              <div className="admin-stat-icon navy-icon">
                R
              </div>

            </div>

            <strong>
              128
            </strong>

            <span>
              Total Resources
            </span>

          </div>


          {/* ACTIVE USERS */}

          <div className="admin-stat-card">

            <div className="admin-stat-top">

              <div className="admin-stat-icon gold-icon">
                U
              </div>

            </div>

            <strong>
              342
            </strong>

            <span>
              Active Users
            </span>

          </div>


          {/* DOWNLOADS */}

          <div className="admin-stat-card">

            <div className="admin-stat-top">

              <div className="admin-stat-icon navy-icon">
                D
              </div>

            </div>

            <strong>
              87
            </strong>

            <span>
              Downloads Today
            </span>

          </div>


          {/* PENDING APPROVALS */}

          <div className="admin-stat-card">

            <div className="admin-stat-top">

              <div className="admin-stat-icon gold-icon">
                !
              </div>

            </div>

            <strong>
              5
            </strong>

            <span>
              Pending Approvals
            </span>

          </div>

        </section>


        {/* =================================================
            MAIN DASHBOARD CONTENT
        ================================================== */}

        <div className="admin-content-grid">


          {/* =================================================
              RECENT RESOURCES
          ================================================== */}

          <section className="admin-panel">

            <div className="admin-panel-header">

              <div>

                <h3>
                  Recent Resources
                </h3>

                <p>
                  Recently uploaded learning materials
                </p>

              </div>


              <button
                type="button"
                className="admin-panel-action"
              >
                View All →
              </button>

            </div>


            <div className="admin-resource-list">

              {recentResources.map((resource) => (

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
                      Uploaded by {resource.uploadedBy}
                    </span>

                  </div>


                  <span
                    className={`admin-status-badge ${
                      resource.status === "Approved"
                        ? "approved"
                        : "pending"
                    }`}
                  >
                    {resource.status}
                  </span>

                </div>

              ))}

            </div>

          </section>


          {/* =================================================
              ANNOUNCEMENTS
          ================================================== */}

          <section className="admin-panel">

            <div className="admin-panel-header">

              <div>

                <h3>
                  Announcements
                </h3>

                <p>
                  Latest system announcements
                </p>

              </div>


              <button
                type="button"
                className="admin-panel-action"
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

                  <div className="admin-announcement-icon">
                    A
                  </div>


                  <div className="admin-announcement-content">

                    <strong>
                      {announcement.title}
                    </strong>

                    <p>
                      {announcement.message}
                    </p>

                    <span>
                      {announcement.date}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          </section>

        </div>


        {/* =================================================
            PENDING APPROVALS PANEL
        ================================================== */}

        <section className="admin-panel">

          <div className="admin-panel-header">

            <div>

              <h3>
                Resource Approvals
              </h3>

              <p>
                Resources waiting for administrator review
              </p>

            </div>


            <button
              type="button"
              className="admin-panel-action"
            >
              Review All →
            </button>

          </div>


          <div className="admin-approval-summary">

            <div className="admin-approval-number">
              5
            </div>

            <div className="admin-approval-information">

              <strong>
                Pending Resources
              </strong>

              <span>
                These resources require administrator
                approval before becoming available
                to students and teachers.
              </span>

            </div>

          </div>

        </section>


        {/* =================================================
            FOOTER
        ================================================== */}

        <footer className="admin-footer">

          © 2026 RLearn Hub — Rosemont Hills Montessori College

        </footer>

      </main>

    </div>
  );
}

export default AdminDashboard;
