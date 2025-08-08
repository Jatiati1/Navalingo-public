// frontend/src/components/Account/sections/TryPro/TryPro.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./TryPro.module.css";

/**
 * FeatureShowcase
 * Presentational block for a Pro feature with an icon, text, and a visual demo.
 * @param {{icon: React.ReactNode, title: string, description: string, children?: React.ReactNode}} props
 */
const FeatureShowcase = ({ icon, title, description, children }) => (
  <div className={styles.featureShowcase}>
    <div className={styles.featureInfo}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDescription}>{description}</p>
    </div>
    <div className={styles.featureVisual}>{children}</div>
  </div>
);

/**
 * TryPro
 * Marketing page highlighting Pro benefits with a CTA to Subscription.
 */
function TryPro() {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate("/account/subscription");
  };

  return (
    <section className={styles.tryProContainer}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <h2 className={styles.heroTitle}>
            Elevate Your Writing with Precision AI
          </h2>
          <p className={styles.heroSubtitle}>
            Go beyond the basics with Navalingo Pro. Unlock our most powerful
            tools, expanded limits, and get the accuracy you need for
            professional work.
          </p>
          <button onClick={handleUpgrade} className={styles.heroButton}>
            Upgrade to Pro
          </button>
        </div>
        <div className={styles.heroVisual}>
          <img
            src="https://i.imgur.com/GGEg4gH.png"
            alt="Abstract AI graphic"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {/* Features */}
      <div className={styles.featuresGrid}>
        <FeatureShowcase
          icon="🎯"
          title="Unlock the Precision AI Engine"
          description="Experience our most advanced AI for unparalleled correction accuracy, nuance, and fluency."
        >
          {/* Before vs After */}
          <div className={styles.visualComparison}>
            <div className={styles.before}>
              <p className={styles.visualLabel}>BEFORE</p>
              <p>they was going to the park but it start to rain</p>
            </div>
            <div className={styles.after}>
              <p className={styles.visualLabel}>AFTER (PRO)</p>
              <p>
                They <span className={styles.highlight}>were</span> going to the
                park, but it <span className={styles.highlight}>started</span>{" "}
                to rain.
              </p>
            </div>
          </div>
        </FeatureShowcase>

        <FeatureShowcase
          icon="📈"
          title="Expand Your Creative Capacity"
          description="Handle larger projects with increased limits on word counts, storage, and weekly credits."
        >
          {/* Limits overview */}
          <div className={styles.visualLimits}>
            <div className={styles.limitItem}>
              <label>Weekly Credits</label>
              <div className={styles.limitBar}>
                <div className={styles.freeBar} style={{ width: "40%" }}>
                  10
                </div>
              </div>
              <div className={styles.limitBar}>
                <div className={styles.proBar} style={{ width: "100%" }}>
                  25
                </div>
              </div>
            </div>
            <div className={styles.limitItem}>
              <label>Document Storage</label>
              <div className={styles.limitBar}>
                <div className={styles.freeBar} style={{ width: "10%" }}>
                  8
                </div>
              </div>
              <div className={styles.limitBar}>
                <div className={styles.proBar} style={{ width: "100%" }}>
                  80
                </div>
              </div>
            </div>
          </div>
        </FeatureShowcase>
      </div>
    </section>
  );
}

export default TryPro;
