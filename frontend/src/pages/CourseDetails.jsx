import "./Courses.css";

function CourseDetails({ course, onBackToCourses }) {
  return (
    <div className="courses-page">

      {/* =========================
          COURSE HEADER
      ========================= */}
      <header className="courses-header">

        <div>
          <h1>{course.title}</h1>

          <p>
            {course.description}
          </p>
        </div>

        <button
          className="back-button"
          onClick={onBackToCourses}
        >
          ← Back to Courses
        </button>

      </header>


      {/* =========================
          COURSE CONTENT
      ========================= */}
      <main className="course-details">

        <section className="course-info-card">

          <div className="course-icon">
            {course.icon}
          </div>

          <div>
            <h2>{course.title}</h2>

            <span className="enrolled-badge">
              Enrolled
            </span>

            <p>
              Welcome to your course. Here you can access
              your learning materials, activities, and
              other course resources.
            </p>
          </div>

        </section>


        {/* =========================
            LEARNING MATERIALS
        ========================= */}
        <section className="course-section">

          <h2>📚 Learning Materials</h2>

          <div className="resource-item">
            <span>📄 Course Module 1</span>
            <button>Open</button>
          </div>

          <div className="resource-item">
            <span>📄 Course Module 2</span>
            <button>Open</button>
          </div>

          <div className="resource-item">
            <span>📖 Reference Materials</span>
            <button>Open</button>
          </div>

        </section>


        {/* =========================
            ACTIVITIES
        ========================= */}
        <section className="course-section">

          <h2>📝 Activities</h2>

          <div className="resource-item">
            <span>Activity 1</span>
            <button>View</button>
          </div>

          <div className="resource-item">
            <span>Activity 2</span>
            <button>View</button>
          </div>

        </section>

      </main>


      {/* =========================
          FOOTER
      ========================= */}
      <footer className="dashboard-footer">
        © 2026 RLearn Hub - Rosemont Hills Montessori College
      </footer>

    </div>
  );
}

export default CourseDetails;