
import { useState } from "react";
import "./ChangePassword.css";

const GATEWAY_API = "http://localhost:8080";

export default function ChangePassword({ user, onBack }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setMessageType("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("Please complete all password fields.");
      setMessageType("error");
      return;
    }

    if (newPassword.length < 8) {
      setMessage("Your new password must be at least 8 characters.");
      setMessageType("error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("The new passwords do not match.");
      setMessageType("error");
      return;
    }

    if (currentPassword === newPassword) {
      setMessage("Your new password must differ from your current password.");
      setMessageType("error");
      return;
    }

    const token =
      user?.token || sessionStorage.getItem("rlearnhub_token");

    if (!token) {
      setMessage("Your session has expired. Please sign in again.");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${GATEWAY_API}/api/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { message: responseText };
      }

      if (!response.ok) {
        setMessage(
          data.message ||
            data.error ||
            `Unable to change password (HTTP ${response.status}).`
        );
        setMessageType("error");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage(data.message || "Your password has been changed successfully.");
      setMessageType("success");
    } catch {
      setMessage(
        "Cannot connect to the server. Please check that the API Gateway is running."
      );
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="change-password-page">
      <section className="change-password-card">
        <button
          type="button"
          className="change-password-back"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>

        <div className="change-password-heading">
          <div className="change-password-icon" aria-hidden="true">
            🔐
          </div>
          <h1>Change Password</h1>
          <p>
            Update your RLearn Hub account password to help keep your
            account secure.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="currentPassword">Current Password</label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />

          <label htmlFor="newPassword">New Password</label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            aria-describedby="password-requirement"
            required
          />
          <small id="password-requirement">
            Use at least 8 characters.
          </small>

          <label htmlFor="confirmNewPassword">
            Confirm New Password
          </label>
          <input
            id="confirmNewPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />

          {message && (
            <p
              className={`change-password-message ${messageType}`}
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            className="change-password-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating Password..." : "Change Password"}
          </button>
        </form>
      </section>
    </main>
  );
}
