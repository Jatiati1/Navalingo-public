// frontend/src/components/Auth/components/SliderControls/SliderControls.jsx
// Toggle between Login and Signup tabs.

import styles from "../../Auth.module.css";

export default function SliderControls({ isLogin, onToggle }) {
  return (
    <div className={styles.slideControls}>
      <input
        type="radio"
        name="slide"
        id="login"
        checked={isLogin}
        onClick={() => onToggle(true)}
        readOnly
      />
      <input
        type="radio"
        name="slide"
        id="signup"
        checked={!isLogin}
        onClick={() => onToggle(false)}
        readOnly
      />
      <label
        htmlFor="login"
        className={`${styles.slide} ${isLogin ? styles.active : ""}`}
      >
        Login
      </label>
      <label
        htmlFor="signup"
        className={`${styles.slide} ${!isLogin ? styles.active : ""}`}
      >
        Signup
      </label>
      <div className={styles.sliderTab} />
    </div>
  );
}
