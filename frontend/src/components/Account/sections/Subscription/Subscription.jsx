// frontend/src/components/Account/sections/Subscription/Subscription.jsx
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Subscription.module.css";
import { useAuth } from "../../../../context/AuthContext.jsx";
import { useToast } from "../../../UI/Toast/ToastProvider.jsx";
import axiosInstance from "../../../../api/axios.js";

/* Presentational helpers */
const Feature = ({ children }) => (
  <li className={styles.featureItem}>
    <svg
      className={styles.featureIcon}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 13l4 4L19 7"
      />
    </svg>
    <div className={styles.featureText}>{children}</div>
  </li>
);

const FaqItem = ({ question, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={styles.faqItem}>
      <button
        type="button"
        className={styles.faqQuestion}
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls={`faq-${question}`}
      >
        <span>{question}</span>
        <svg
          className={`${styles.faqIcon} ${isOpen ? styles.open : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        id={`faq-${question}`}
        className={`${styles.faqAnswer} ${isOpen ? styles.open : ""}`}
      >
        <p>{children}</p>
      </div>
    </div>
  );
};

function Subscription() {
  const { currentUser, refreshCurrentUser } = useAuth();
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const confirmedFor = useRef(null); // prevent double-confirm on same sessionId

  const isPro = currentUser?.subscriptionTier === "pro";

  // Handle Stripe redirect (?session_id=...)
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const sessionId = sp.get("session_id");
    if (!sessionId || confirmedFor.current === sessionId) return;

    confirmedFor.current = sessionId;
    (async () => {
      try {
        await axiosInstance.get("/stripe/confirm", {
          params: { session_id: sessionId },
        });
        await refreshCurrentUser();
        showToast("Upgrade confirmed — you're now on Pro.", {
          severity: "success",
        });
      } catch (e) {
        const msg =
          e?.response?.data?.error ||
          "We couldn't confirm your upgrade yet. It may take a moment.";
        showToast(msg, { severity: "warning" });
      } finally {
        // Clean the URL (remove session_id)
        sp.delete("session_id");
        navigate({ search: sp.toString() }, { replace: true });
      }
    })();
  }, [location.search, navigate, refreshCurrentUser, showToast]);

  // Upgrade → request Checkout URL, then redirect
  const handleUpgrade = async () => {
    setIsProcessing(true);
    try {
      const { data } = await axiosInstance.post(
        "/stripe/create-checkout-session"
      );
      const { checkoutUrl } = data || {};
      if (!checkoutUrl) throw new Error("Missing checkoutUrl from server.");
      window.location.assign(checkoutUrl); // Stripe Hosted Checkout
    } catch (error) {
      const msg =
        error?.response?.data?.error ||
        error?.message ||
        "Could not open the payment page. Please try again.";
      showToast(msg, { severity: "error" });
      setIsProcessing(false);
    }
  };

  // Downgrade → cancel subscription
  const handleDowngrade = async () => {
    const ok = window.confirm(
      "Are you sure you want to downgrade? You will lose Pro access at the end of your current billing period."
    );
    if (!ok) return;

    setIsProcessing(true);
    try {
      await axiosInstance.delete("/stripe/subscription");
      await refreshCurrentUser();
      showToast(
        "Your Pro plan will be canceled at the end of your billing cycle.",
        {
          severity: "success",
        }
      );
    } catch (error) {
      const msg =
        error?.response?.data?.error ||
        "Could not process your downgrade request.";
      showToast(msg, { severity: "error" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.subscriptionPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>Unlock Your Full Potential</h1>
        <p className={styles.subtitle}>
          Choose the plan that's right for you and elevate your work with
          Navalingo.
        </p>
      </div>

      <div className={styles.pricingTable}>
        {/* Pro Plan */}
        <div className={`${styles.planCard} ${styles.proPlan}`}>
          <div className={styles.popularBadge}>MOST POPULAR</div>
          <h2 className={styles.planTitle}>Navalingo Pro</h2>
          <p className={styles.planDescription}>
            For professionals and critical work.
          </p>
          <div className={styles.price}>
            <span className={styles.priceAmount}>$2.99</span>
            <span className={styles.pricePeriod}>/ month</span>
          </div>
          <ul className={styles.featuresList}>
            <Feature>
              <span className={styles.featureEmphasis}>
                Precision AI Engine
              </span>{" "}
              for expert-level accuracy.
            </Feature>
            <Feature>
              <span className={styles.featureEmphasis}>25 Weekly Credits</span>
              <br />
              <span className={styles.featureSubtext}>
                More than double the power, every week.
              </span>
            </Feature>
            <Feature>
              <span className={styles.featureEmphasis}>600 words</span> Base
              Word Count
            </Feature>
            <Feature>
              <span className={styles.featureEmphasis}>
                Dynamic Smart Buffer
              </span>
            </Feature>
            <Feature>
              Save up to{" "}
              <span className={styles.featureEmphasis}>80 documents</span>
            </Feature>
            <Feature>
              <span className={styles.featureEmphasis}>
                Exclusive Member Discount
              </span>{" "}
              on Extra Credits
            </Feature>
          </ul>
          <button
            onClick={handleUpgrade}
            disabled={isPro || isProcessing}
            className={`${styles.planButton} ${styles.proButton}`}
          >
            {isProcessing && !isPro
              ? "Redirecting..."
              : isPro
                ? "Your Current Plan"
                : "Go Pro & Unlock Precision"}
          </button>
        </div>

        {/* Free Plan */}
        <div className={styles.planCard}>
          <h2 className={styles.planTitle}>Navalingo Free</h2>
          <p className={styles.planDescription}>
            For casual use and everyday tasks.
          </p>
          <div className={styles.price}>
            <span className={styles.priceAmount}>Free</span>
          </div>
          <ul className={styles.featuresList}>
            <Feature>
              <span className={styles.featureEmphasis}>Essential AI</span> for
              everyday tasks.
            </Feature>
            <Feature>
              <span className={styles.featureEmphasis}>10</span> Weekly Credits
            </Feature>
            <Feature>
              <span className={styles.featureEmphasis}>200 words</span> Base
              Word Count
            </Feature>
            <Feature>Standard Word Buffer</Feature>
            <Feature>
              Save up to{" "}
              <span className={styles.featureEmphasis}>8 documents</span>
            </Feature>
            <Feature>Available at Standard Rate</Feature>
          </ul>
          <button
            onClick={handleDowngrade}
            disabled={!isPro || isProcessing}
            className={`${styles.planButton} ${styles.freeButton}`}
          >
            {isProcessing && isPro
              ? "Processing..."
              : !isPro
                ? "Your Current Plan"
                : "Downgrade to Free"}
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div className={styles.faqSection}>
        <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
        <div className={styles.faqList}>
          <FaqItem question='What is a "Credit"?'>
            A Credit is used each time you run our translation or correction
            tools.
          </FaqItem>
          <FaqItem question="What is the Word Buffer?">
            When text is translated, its length often changes. The Word Buffer
            temporarily increases your word limit to ensure the entire result
            fits without being cut off. Pro plans have a more generous buffer
            for complex documents.
          </FaqItem>
          <FaqItem question="What if I run out of Credits?">
            You can purchase additional Credit packs at any time. Pro
            subscribers receive an exclusive discount on all packs.
          </FaqItem>
        </div>
      </div>
    </div>
  );
}

export default Subscription;
