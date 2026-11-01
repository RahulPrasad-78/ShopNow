import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useNotify } from "../context/NotificationContext";
import "../styles/auth.css";

const RESEND_SECONDS = 60;

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { toast } = useNotify();

  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  // Right after registering the code was just sent, so start on cooldown.
  const [cooldown, setCooldown] = useState(location.state?.email ? RESEND_SECONDS : 0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = useCallback(
    async (address, { silent = false } = {}) => {
      try {
        const res = await fetch("/api/auth/resend-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: address }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setCooldown(RESEND_SECONDS);
          if (!silent) toast.success("A new code is on its way");
        } else if (!silent) {
          toast.error(data.message || "Could not resend the code");
        }
      } catch (error) {
        console.error(error);
        if (!silent) toast.error("Something went wrong. Please try again.");
      }
    },
    [toast],
  );

  // Arriving from a blocked login: no code was just sent, so send one.
  const autoSent = useRef(false);
  useEffect(() => {
    if (location.state?.resend && location.state?.email && !autoSent.current) {
      autoSent.current = true;
      resend(location.state.email);
    }
  }, [location.state, resend]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        login(data);
        toast.success("Email verified. Welcome to ShopNow!");
        navigate("/");
      } else if (res.ok) {
        toast.info(data.message || "Account already verified");
        navigate("/login");
      } else {
        toast.error(data.message || "Verification failed");
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
        <h2>Verify your email</h2>
        <p className="auth-sub">
          {location.state?.email
            ? <>Enter the 6-digit code we sent to <strong>{email}</strong>.</>
            : "Enter your email and the 6-digit code we sent you."}
        </p>
        {!location.state?.email && (
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        )}
        <input
          className="otp-input"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="••••••"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          required
          autoFocus
        />
        <button type="submit" className="btn" disabled={busy || otp.length !== 6}>
          {busy ? "Verifying..." : "Verify"}
        </button>
        <p>
          Didn't get it?{" "}
          <button
            type="button"
            className="link-button"
            disabled={cooldown > 0 || !email}
            onClick={() => resend(email)}
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </p>
        <p>
          <Link to="/login">Back to login</Link>
        </p>
      </form>
    </div>
  );
};

export default VerifyEmail;
