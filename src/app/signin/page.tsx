"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signInWithGoogle } from "@/firebase/firebaseAuth";
import styles from "./page.module.css";

const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signIn(email, password);
      router.push("/");
    } catch {
      setError("Whoops, something went wrong!");
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      await signInWithGoogle();
      router.push("/");
    } catch {
      setError("Whoops, something went wrong!");
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>Sign In</h1>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleSignIn} className={styles.form}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            placeholder="Email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            placeholder="Password"
          />
          <button type="submit" className={styles.primaryButton}>
            Sign In
          </button>
        </form>

        <div className={styles.dividerContainer}>
          <div className={styles.divider}></div>
          <span className={styles.dividerText}>OR</span>
          <div className={styles.divider}></div>
        </div>

        <button onClick={handleGoogleSignIn} className={styles.googleButton}>
          Sign In with Google
        </button>
      </div>
    </div>
  );
};

export default SignInPage;
