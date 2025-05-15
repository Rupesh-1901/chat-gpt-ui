// src/components/AuthModal.js
import React, { useState } from "react";
import { Modal, Button, Input, Icon } from "@/components";
import { auth, googleProvider } from "../context/firebase";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

// You can use a Google SVG or Font Awesome
const googleIconUrl =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/225px-Google_%22G%22_logo.svg.png";

export function AuthModal({ visible, onClose, onSignUpSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const saveUserToMongoDB = async (user) => {
    try {
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        emailVerified: user.emailVerified,
        authProvider: user.providerData[0]?.providerId || 'email'
      };

      const response = await fetch('http://65.109.233.16:3001/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to save user data');
      }

      const data = await response.json();
      console.log('User saved to MongoDB:', data);
    } catch (error) {
      console.error('Error saving user to MongoDB:', error);
      // Don't throw the error as we still want to proceed with the signup flow
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!isLogin) {
        // Save user data to MongoDB for new sign ups
        await saveUserToMongoDB(result.user);
        // If it's a sign up flow, trigger the profile creation
        onSignUpSuccess();
      }
      onClose();
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        console.warn("User closed the Google sign-in popup.");
      } else {
        console.error("Error during Google sign-in:", err.message);
      }
    }
  };

  const handleEmailAuth = async () => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Save user data to MongoDB for new sign ups
        await saveUserToMongoDB(result.user);
        // After successful sign up, trigger the profile creation
        onSignUpSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Inline Styles for Modal
  const styles = {
    modalContent: {
      display: "flex",
      flexDirection: "row",
      width: "1200px",
      minHeight: "600px",
    },
    leftSide: {
      flex: "2",
      padding: "40px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      height: "100%",
      marginTop: "74px",
    },
    rightSide: {
      flex: "3",
      background:
        "linear-gradient(to top, rgba(12, 60, 253, 0.2), rgba(74, 108, 247, 0.05) 70%, white)",
      padding: "12px",
      paddingRight: "26px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      borderTopRightRadius: "8px",
      borderBottomRightRadius: "8px",
      // height: "100%",
      overflow: "auto",
    },
    logoContainer: {
      marginBottom: "30px",
      textAlign: "center",
      width: "100%",
    },
    logo: {
      maxWidth: "250px",
      marginBottom: "25px",
    },
    insightsTitle: {
      fontSize: "28px",
      fontWeight: "bold",
      marginBottom: "35px",
      textAlign: "center",
      color: "#333",
    },
    featureItem: {
      display: "flex",
      alignItems: "flex-start",
      marginBottom: "24px",
      fontSize: "16px",
      color: "#333",
      width: "100%",
      maxWidth: "450px",
    },
    featureIcon: {
      minWidth: "40px",
      height: "40px",
      marginRight: "15px",
      backgroundColor: "#f0f4ff",
      borderRadius: "8px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "20px",
      color: "#4a6cf7",
    },
    featureText: {
      fontSize: "16px",
      lineHeight: "1.5",
      color: "#555",
      fontWeight: "500",
    },
    container: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      fontFamily: "Arial, sans-serif",
      width: "100%",
      maxWidth: "320px",
      margin: "0 auto",
    },
    buttonGoogle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#d6e0f2",
      color: "black",
      border: "none",
      padding: "12px 20px",
      borderRadius: "5px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "bold",
      width: "100%",
    },
    googleIcon: {
      width: "18px",
      height: "18px",
      marginRight: "8px",
    },
    separator: {
      display: "flex",
      alignItems: "center",
      margin: "20px 0",
      color: "#aaa",
      fontSize: "12px",
      textTransform: "uppercase",
    },
    separatorLine: {
      flex: 1,
      height: "1px",
      backgroundColor: "#ddd",
    },
    input: {
      padding: "12px",
      fontSize: "14px",
      borderRadius: "5px",
      border: "1px solid #ccc",
      outline: "none",
      width: "100%",
    },
    error: {
      color: "red",
      fontSize: "12px",
      textAlign: "center",
      marginTop: "10px",
      marginBottom: "5px",
    },
    toggle: {
      textAlign: "center",
      fontSize: "14px",
      color: "#555",
      marginBottom: "20px",
    },
    toggleLink: {
      color: "#007BFF",
      cursor: "pointer",
      fontWeight: "bold",
      marginLeft: "4px",
    },
    submitButton: {
      backgroundColor: "#007BFF",
      color: "#fff",
      border: "none",
      padding: "12px",
      borderRadius: "5px",
      fontWeight: "bold",
      cursor: "pointer",
      width: "100%",
      marginTop: "8px",
    },
    termsText: {
      fontSize: "12px",
      color: "#666",
      textAlign: "center",
      marginTop: "20px",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "4px",
      flexWrap: "wrap",
    },
    termsLink: {
      fontSize: "12px",
      color: "#007BFF",
      textDecoration: "underline",
      cursor: "pointer",
      display: "inline-block",
    },
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={isLogin ? "Login" : "Sign Up"}
      width={1200}
      draggable={false}
      style={{ height: "auto", maxHeight: "90vh", maxWidth: "95vw" }}
    >
      <div style={styles.modalContent}>
        {/* Left Side - Auth Form */}
        <div style={styles.leftSide}>
          {/* Toggle Login/Signup */}
          <div style={styles.toggle}>
            {isLogin ? (
              <>
                Don't have an account?
                <span style={styles.toggleLink} onClick={() => setIsLogin(false)}>
                  Sign Up
                </span>
              </>
            ) : (
              <>
                Already have an account?
                <span style={styles.toggleLink} onClick={() => setIsLogin(true)}>
                  Login
                </span>
              </>
            )}
          </div>

          <div style={styles.container}>
            {/* Google Sign-In Button */}
            <button style={styles.buttonGoogle} onClick={handleGoogleSignIn}>
              <img
                src={googleIconUrl}
                alt="Google Icon"
                style={styles.googleIcon}
              />
              Continue with Google
            </button>

            {/* Separator */}
            <div style={styles.separator}>
              <div style={styles.separatorLine}></div>
              <span>OR</span>
              <div style={styles.separatorLine}></div>
            </div>

            {/* Email Input */}
            <input
              style={styles.input}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {/* Password Input */}
            <input
              style={styles.input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Error Message */}
            {/* {error && <div style={styles.error}>{error}</div>} */}

            {/* Submit Button */}
            <button style={styles.submitButton} onClick={handleEmailAuth}>
              {isLogin ? "Login" : "Sign Up"}
            </button>

            {/* Terms and Privacy Notice */}
            {!isLogin && (
              <div style={styles.termsText}>
                By signing up you agree to our{' '}
                <a 
                  href="https://danora.ai/terms-and-conditions/"
                  style={styles.termsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  terms of service
                </a> and{' '}
                <a 
                  href="https://danora.ai/privacy-policy/"
                  style={styles.termsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  privacy policy
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Danora Logo and Gen Z Insights */}
        <div style={styles.rightSide}>
          <div style={styles.logoContainer}>
            <img 
              src="https://danora.ai/wp-content/uploads/2023/09/Danora-Logo-Blue-_-White-BG-removebg-preview.png" 
              alt="Danora Logo" 
              style={styles.logo} 
            />
            <h2 style={styles.insightsTitle}>Unlock GenZ Insights in Seconds.</h2>
          </div>

          <div style={{width: "100%", maxWidth: "450px"}}>
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={styles.featureText}>Create a Gen Z target persona in seconds.</div>
            </div>

            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={styles.featureText}>See real-time Gen Z trends from millions of conversations.</div>
            </div>

            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 2H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={styles.featureText}>Get AI-powered insights that predict what Gen Z wants.</div>
            </div>

            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9L12 20L21 9L16 4H8L3 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 9H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 2L18 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 1L13 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 2L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={styles.featureText}>Make smarter decisions to connect with Gen Z faster.</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
