// frontend/src/components/Account/sections/Subscription/DowngradeFlow.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext.jsx";
import useDowngradeStep1 from "./hooks/useDowngradeStep1.jsx";
import useDowngradeStep2 from "./hooks/useDowngradeStep2.jsx";
import useDowngradeStep3 from "./hooks/useDowngradeStep3.jsx";
import styles from "./DowngradeFlow.module.css";

/* tiny icons (inline so we stay at 4 files total) */
const IconPlus = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M12 2v20M2 12h20" />
  </svg>
);
const IconCheck = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
const IconX = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export default function DowngradeFlow() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [step, setStep] = useState(1);

  const go = (n) => setStep(n);
  const next = () => setStep((s) => Math.min(3, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  // Call hooks UNCONDITIONALLY to satisfy rules-of-hooks
  const s1 = useDowngradeStep1({ currentUser, go, navigate });
  const s2 = useDowngradeStep2({ next, prev });
  const s3 = useDowngradeStep3({ prev, navigate });

  const isPro = currentUser?.subscriptionTier === "pro";

  useEffect(() => {
    if (isPro === false) {
      navigate("/account/subscription", { replace: true });
    }
  }, [isPro, navigate]);

  if (isPro === false) return null;

  return (
    <div className={styles.shell}>
      {/* STEP 1 */}
      {step === 1 && (
        <section className={styles.card} aria-labelledby="s1-title">
          <header className={styles.stageHead}>
            <h1 id="s1-title" className={styles.title}>
              Before you downgrade
            </h1>
            <p className={styles.subtitle}>
              You’ll lose Pro features immediately. A quick look at what changes
              with the Free plan:
            </p>
            <div className={styles.stepper}>
              <span className={styles.stepPill}>Step 1 of 3 • Consider</span>
            </div>
          </header>

          <div className={`${styles.body} ${styles.grid2}`}>
            <div>
              <ul className={styles.lossList}>
                {s1.losses.map((l) => (
                  <li key={l.title}>
                    <IconPlus />
                    <div>
                      <strong>{l.title}</strong>
                      {l.tip ? <div className={styles.tip}>{l.tip}</div> : null}
                    </div>
                  </li>
                ))}
              </ul>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.primary}`}
                  onClick={s1.onKeepPro}
                >
                  Keep Pro
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.subtle}`}
                  onClick={s1.onContinue}
                >
                  Continue to downgrade
                </button>
              </div>

              {s1.resetText && (
                <p className={styles.footerNote}>
                  Reset window: <span>{s1.resetText}</span> remaining. (Server
                  remains the source of truth.)
                </p>
              )}
            </div>

            <aside className={styles.aside}>
              <h4>Why people stay on Pro</h4>
              {s1.benefits.map((b) => (
                <div key={b.title} className={styles.feature}>
                  <IconCheck />
                  <div>
                    <strong>{b.title}</strong>
                    <div className={styles.tip}>{b.tip}</div>
                  </div>
                </div>
              ))}
            </aside>
          </div>
        </section>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <section className={styles.card} aria-labelledby="s2-title">
          <header className={styles.stageHead}>
            <h2 id="s2-title" className={styles.title}>
              Mind sharing why you’re leaving?
            </h2>
            <p className={styles.subtitle}>
              A quick reason helps us improve. We’ll also suggest fixes that
              might solve it, fast.
            </p>
            <div className={styles.stepper}>
              <span className={styles.stepPill}>Step 2 of 3 • Feedback</span>
            </div>
          </header>

          <div className={`${styles.body} ${styles.grid2}`}>
            <div>
              {/* group radios for a11y */}
              <div
                className={styles.reasonList}
                role="radiogroup"
                aria-labelledby="s2-title"
              >
                {s2.options.map(([val, label]) => (
                  <label key={val} className={styles.reason}>
                    <input
                      type="radio"
                      name="downgrade-reason"
                      value={val}
                      checked={s2.reason === val}
                      onChange={(e) => s2.setReason(e.target.value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.ghost}`}
                  onClick={s2.goBack}
                >
                  Back
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.subtle}`}
                  onClick={s2.goNext}
                >
                  Continue
                </button>
              </div>
            </div>

            <aside className={styles.aside}>{s2.suggestion}</aside>
          </div>
        </section>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <section className={styles.card} aria-labelledby="s3-title">
          <header className={styles.stageHead}>
            <h2 id="s3-title" className={styles.title}>
              Confirm downgrade to Free
            </h2>
            <p className={styles.subtitle}>
              This takes effect immediately. Pro features will be removed and
              credits reset to the Free plan.
            </p>
            <div className={styles.stepper}>
              <span className={styles.stepPill}>Step 3 of 3 • Confirm</span>
            </div>
          </header>

          <div className={styles.body}>
            {/* Two columns only, no "Another option" */}
            <div className={styles.grid2Equal}>
              <div className={styles.aside}>
                <h4>You will keep</h4>
                {s3.keep.map((t) => (
                  <div key={t} className={styles.feature}>
                    <IconCheck />
                    <div>{t}</div>
                  </div>
                ))}
              </div>

              {/* Mark this as 'lose' so X icons are red via CSS */}
              <div className={`${styles.aside} ${styles.lose}`}>
                <h4>You will lose</h4>
                {s3.lose.map((t) => (
                  <div key={t} className={styles.feature}>
                    <IconX />
                    <div>{t}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.primary}`}
                onClick={s3.keepPro}
              >
                Keep Pro
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.outline}`}
                onClick={s3.back}
              >
                Back
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.danger}`}
                onClick={s3.confirm}
                disabled={s3.busy}
              >
                {s3.busy ? "Downgrading…" : "Downgrade to Free now"}
              </button>
            </div>

            <p className={styles.footerNote}>
              By continuing, your subscription will be canceled and your account
              moved to the Free tier immediately.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
