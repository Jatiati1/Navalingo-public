// frontend/src/components/Account/sections/Feedback/Feedback.jsx
import React, { useState } from "react";
import styles from "./Feedback.module.css";

/**
 * Feedback categories presented to the user.
 */
const FEEDBACK_TYPES = [
  { value: "general", label: "General Feedback" },
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "improvement", label: "Suggestion for Improvement" },
];

/**
 * Feedback — simple, client-side feedback form.
 * Note: This is a view-only demo; submission simulates an API call.
 */
function Feedback() {
  const [feedbackType, setFeedbackType] = useState(FEEDBACK_TYPES[0].value);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validate and submit the form (simulated).
   * No console logging in public build.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      alert("Please provide a description for your feedback.");
      return;
    }
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    alert("Thank you for your feedback!");
    setFeedbackType(FEEDBACK_TYPES[0].value);
    setSubject("");
    setDescription("");
    setIsSubmitting(false);
  };

  return (
    <section className={styles.feedbackContainer}>
      <h2 className="section-title">Submit Feedback</h2>
      <p className="section-description">
        We value your input! Share your thoughts, report issues, or suggest new
        features.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="feedback-type">Feedback Type</label>
          <select
            id="feedback-type"
            className="setting-select" // Reusing style from Account.css
            value={feedbackType}
            onChange={(e) => setFeedbackType(e.target.value)}
            disabled={isSubmitting}
          >
            {FEEDBACK_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="feedback-subject">Subject (Optional)</label>
          <input
            id="feedback-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="input-field"
            placeholder="Briefly summarize your feedback"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="feedback-description">Description</label>
          <textarea
            id="feedback-description"
            rows="6"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field" // Reusing style
            placeholder="Please provide as much detail as possible..."
            required
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          className="action-button-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>
    </section>
  );
}

export default Feedback;
