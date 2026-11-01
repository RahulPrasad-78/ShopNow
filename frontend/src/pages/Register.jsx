import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useNotify } from "../context/NotificationContext";
import PasswordInput from "../components/PasswordInput";
import "../styles/auth.css";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const { toast } = useNotify();
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);

  // The clicked button's value ("user" | "test") says which kind of account.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const accountType = e.nativeEvent.submitter?.value === "test" ? "test" : "user";
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, accountType }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Registration failed");
      } else if (data.requiresVerification) {
        toast.success(`We sent a 6-digit code to ${data.email}`);
        navigate("/verify-email", { state: { email: data.email } });
      } else {
        login(data);
        toast.success("Test account created. You're logged in!");
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Register</h2>
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordInput
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" name="accountType" value="user" className="btn" disabled={busy}>
          Register
        </button>
        <button type="submit" name="accountType" value="test" className="btn btn-secondary" disabled={busy}>
          Register as Test User
        </button>
        <small className="auth-hint">
          Register sends a code to your email to verify it. A test user skips
          verification and logs in instantly.
        </small>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
