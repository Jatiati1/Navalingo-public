// frontend/src/components/Account/sections/Subscription/hooks/useDowngradeStep2.js
import React, { useState, useMemo, useCallback } from "react";
import styles from "../DowngradeFlow.module.css";

const OPTIONS = [
  ["not-using", "Not using it enough"],
  ["too-expensive", "Too expensive"],
  ["ran-out-credits", "I ran out of credits"],
  // removed: ["missing-feature", "Missing a feature"],
  ["alt", "I’m using an alternative"],
  ["other", "Other"],
];

export default function useDowngradeStep2({ next, prev }) {
  const [reason, setReason] = useState("");

  const suggestion = useMemo(() => {
    switch (reason) {
      case "not-using":
        return (
          <>
            <h4>Use it more with less effort</h4>
            <p className={styles.tip}>
              Pin Navalingo in your toolbar so it’s always one click away. You
              can also set a keyboard shortcut for instant access.
            </p>
          </>
        );
      case "too-expensive":
        return (
          <>
            <h4>Cost saver</h4>
            <p className={styles.tip}>
              Keep Pro for full power: 25 daily credits, a larger buffer, and
              the Precision AI engine. Fewer reruns and more done per run.
            </p>
          </>
        );
      case "ran-out-credits":
        return (
          <>
            <h4>Avoid running out</h4>
            <p className={styles.tip}>
              On Pro you get 25 credits per day and a larger buffer so each run
              covers more.
            </p>
          </>
        );
      case "alt":
        return (
          <>
            <h4>We can coexist</h4>
            <p className={styles.tip}>
              Keep Pro for precision grammar and long-form safety; use your
              other tool for anything else.
            </p>
          </>
        );
      case "other":
        return (
          <>
            <h4>Thanks for the context</h4>
            <p className={styles.tip}>
              We read every note. Your feedback directly shapes our roadmap.
            </p>
          </>
        );
      default:
        return (
          <>
            <h4>Suggested quick fix</h4>
            <p className={styles.tip}>Select a reason to see ideas.</p>
          </>
        );
    }
  }, [reason]);

  const options = useMemo(() => OPTIONS, []);
  const goBack = useCallback(() => prev(), [prev]);
  const goNext = useCallback(() => next(), [next]);

  return { reason, setReason, suggestion, options, goBack, goNext };
}
