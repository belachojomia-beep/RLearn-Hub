import { useState } from "react";
import "./Courses.css";
import CourseDetails from "./CourseDetails";

function Courses({ onBackToDashboard }) {
  const [selectedCourse, setSelectedCourse] = useState(null);

  if (selectedCourse) {
    return (
      <CourseDetails
        course={selectedCourse}
        onBackToCourses={() => setSelectedCourse(null)}
      />
    );
  }

  return (
    <div className="courses-page">

      {/* HEADER */}
      <header className="courses-header">
        <div>
          <h1>My Courses</h1>
          <p>View your enrolled courses and learning materials.</p>
        </div>

        <button onClick={onBackToDashboard}>
          ← Back to Dashboard
        </button>
      </header>


      {/* COURSE LIST */}
      <section className="courses-container">

        {/* COURSE 1 */}
        <div className="course-card">

          <div className="course-icon">
            📘
          </div>

          <div className="course-content">

            <span className="course-status">
              Enrolled
            </span>

            <h2>Sample Course</h2>

            <p>
              Welcome to your course. Access lessons,
              modules, and learning materials here.
            </p>

            <div className="course-info">
              <span>📚 Learning Materials</span>
              <span>📝 Activities</span>
            </div>

            <button
                className="course-button"
                onClick={() =>
                 setSelectedCourse({
                    title: "Sample Course",
                    description:
                        "Welcome to your course. Access lessons, modules, and learning materials here.",
                        icon: "📘",
                    })
                 }
                >
                 Open Course →
                </button>

          </div>

        </div>


        {/* COURSE 2 */}
        <div className="course-card">

          <div className="course-icon">
            💻
          </div>

          <div className="course-content">

            <span className="course-status">
              Enrolled
            </span>

            <h2>Information Technology</h2>

            <p>
              Explore lessons, activities, and resources
              related to Information Technology.
            </p>

            <div className="course-info">
              <span>📚 Learning Materials</span>
              <span>📝 Activities</span>
            </div>

            <button className="course-button">
              Open Course →
            </button>

          </div>

        </div>


        {/* COURSE 3 */}
        <div className="course-card">

          <div className="course-icon">
            🔬
          </div>

          <div className="course-content">

            <span className="course-status">
              Enrolled
            </span>

            <h2>Science</h2>

            <p>
              Access your Science lessons, resources,
              and learning activities.
            </p>

            <div className="course-info">
              <span>📚 Learning Materials</span>
              <span>📝 Activities</span>
            </div>

            <button className="course-button">
              Open Course →
            </button>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Courses;