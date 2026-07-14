import React, {
  useState,
  useRef,
  useEffect,
} from "react";

import { motion as Motion } from "framer-motion";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  ArrowLeft,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";


const VerifyOTP = () => {
const navigate = useNavigate();
const location = useLocation();

const email = location.state?.email || "";

const [otp, setOtp] = useState([
  "",
  "",
  "",
  "",
  "",
  "",
]);

const [loading, setLoading] = useState(false);

const [error, setError] = useState("");

const [timer, setTimer] = useState(60);

const inputRefs = useRef([]);

useEffect(() => {

  if(timer <= 0) return;

  const interval = setInterval(() => {

    setTimer(prev => prev-1);

  }, 1000);
  return () => clearInterval(interval);

}, [timer]);

useEffect(() => {
  inputRefs.current[0]?.focus();
}, []);

const handleChange = (index, digit) => {

  // Allow only numbers
  if (!/^\d*$/.test(digit)) return;

  const newOtp = [...otp];

  newOtp[index] = digit;

  setOtp(newOtp);

  if (error) {
    setError("");
  }

  // Move forward after entering a digit
  if (digit && index < newOtp.length - 1) {
    inputRefs.current[index + 1]?.focus();
  }
};

const handleKeyDown = (index, e) => {

  if (e.key !== "Backspace") return;

  const newOtp = [...otp];
  
  //If current box has a digit, clear it first
  if (otp[index] !== "") {

    newOtp[index] = "";
    setOtp(newOtp);

    return;
  }

  // Current box already empty -> move back
  if (index > 0) {

    inputRefs.current[index - 1]?.focus();

    newOtp[index - 1] = "";

    setOtp(newOtp);

  }

};

const handlePaste = (e) => {

  e.preventDefault();

  const pastedText = e.clipboardData
    .getData("text")
    .replace(/\D/g, "")
    .slice(0, otp.length);

  if (!pastedText) return;

  const newOtp = [...otp];

  pastedText.split("").forEach((digit, index) => {
    newOtp[index] = digit;
  });

  setOtp(newOtp);

  const nextIndex = Math.min(
    pastedText.length,
    otp.length - 1
  );

  inputRefs.current[nextIndex]?.focus();

  if(error) {
    setError("");
  }
};

const handleVerify = async () => {

  const enteredOtp = otp.join("");

  if (enteredOtp.length !== 6) {
    setError("Please enter all 6 digits.");
    return;
  }

  setError("");

  setLoading(true);

  try {
    const response = await fetch(
      "http://localhost:8080/verify-otp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp: enteredOtp,
        }),
      }
    );

    const data = await response.json();

    console.log("Verify OTP Response:", data);

    if (!response.ok) {
      throw new Error(data.detail || "OTP verification failed.");
    }

    navigate("/reset-password", {
      state: {
        email,
      },
    });
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

const handleResend = () => {

  setTimer(60);

  setOtp(["", "", "", "", "", ""]);

  inputRefs.current[0]?.focus();

  // Backend resend API will be connected later
  console.log("Resending OTP...");
  setLoading(false);
};

return (

  <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-background-soft">

    {/* Background */}

    <div className="absolute inset-0 overflow-hidden">
      <Motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          opacity: [0.08, 0.15, 0.08],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-primary blur-[160px]"
    />

  </div>
   <div className="w-full max-w-md relative z-10">
   <button
      onClick={() => navigate("/forgot-password")}
      className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-8"
    >

      <ArrowLeft className="w-4 h-4" />

      Back

    </button>

    <GlassCard className="p-8">

      <div className="text-center mb-8">

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xl mb-6">

          <ShieldCheck className="w-8 h-8 text-primary" />

        </div>

        <h1 className="text-3xl font-bold mb-3">

          Verify OTP

        </h1>

        <p className="text-slate-500">

          Enter the verification code sent to

        </p>

        <p className="font-semibold text-primary mt-2">

          {email}

        </p>

      </div>

      {error &&(
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div
        className="flex justify-center gap-3 mb-8"
        onPaste={handlePaste}
      >

        {otp.map((digit, index) => (

          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;     
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            onChange={(e) =>
              handleChange(index, e.target.value)
            }
            onKeyDown={(e) =>
              handleKeyDown(index, e)
            }
            onFocus={(e) => e.target.select()}
            className="
              w-14
              h-16
              rounded-xl
              border
              border-slate-300
              bg-white
              text-center
              text-2xl
              font-bold
              text-slate-800
              shadow-sm
              transition-all
              duration-200
              focus:outline-none
              focus:ring-2
              focus:ring-primary
              focus:border-primary
            "
          />

        ))}

</div>

<div className="text-center">

  <div className="mb-6">
    {timer > 0 ?  (
      <>
        <p className="text-sm text-slate-500">
          Resend OTP in
        </p>

        <p className="mt-2 text-2xl font-bold text-primary">
          00:{timer.toString().padStart(2, "0")}
        </p>
      </>

    ) : (
      <>
        <p className="text-sm text-slate-500">
          Didn't receive the code?
        </p>

        <p className="mt-2 text-green-600 font-semibold">
          You can request a new OTP now.
        </p>
      </>
    )}
  </div>

  <Button
    className="w-full py-4 text-lg font-bold mb-4"
    onClick={handleVerify}
    isLoading={loading}
  >
    Verify OTP
  </Button>

  <Button
    variant="ghost"
    onClick={handleResend}
    disabled={timer > 0}
    className={`
      w-full
      flex
      items-center
      justify-center
      gap-2
      transition-all
      duration-300
      ${
        timer > 0
          ? "opacity-50 cursor-not-allowed"
          : "text-primary hover:bg-primary/10"
      }
    `}
  >
    <RotateCcw className="w-4 h-4" />
    
    {timer > 0
      ? "Resend Disabled"
      : "Resend OTP"
    }
  </Button>

</div>

</GlassCard>

</div>

</div>

);

};

export default VerifyOTP;