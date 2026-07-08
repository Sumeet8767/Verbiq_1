<<<<<<< HEAD
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

const [timer, setTimer] = useState(60);

const inputRefs = useRef([]);

useEffect(() => {
  if(timer<=0) return;
  const interval = setInterval(() =>{
    setTimer((prev) => prev-1);
  }, 1000);
  return () => clearInterval(interval);

},[timer]);

const handleChange = (index, value) => {

  // Allow only numbers
  if (!/^\d*$/.test(value)) return;

  const newOtp = [...otp];

  newOtp[index] = value.slice(-1);

  setOtp(newOtp);

  // Move to next input automatically
  if (value && index < 5) {
    inputRefs.current[index + 1]?.focus();
  }

};

const handleKeyDown = (index, e) => {

  if (
    e.key === "Backspace" &&
    otp[index] === "" &&
    index > 0
  ) {
    inputRefs.current[index - 1]?.focus();
  }

};

const handlePaste = (e) => {

  e.preventDefault();

  const pastedData = e.clipboardData
    .getData("text")
    .trim();

  if (!/^\d{6}$/.test(pastedData)) return;

  const digits = pastedData.split("");

  setOtp(digits);

  digits.forEach((digit, index) => {

    if (inputRefs.current[index]) {
      inputRefs.current[index].value = digit;
    }

  });

  inputRefs.current[5]?.focus();

};

const handleVerify = async () => {

  const enteredOtp = otp.join("");

  if (enteredOtp.length !== 6) {
    alert("Please enter the complete OTP.");
    return;
  }

  setLoading(true);

  try {

    console.log("Entered OTP:", enteredOtp);

    // Backend API will be connected later

    setTimeout(() => {

      navigate("/reset-password", {
        state: {
          email,
        },
      });

    }, 1200);

  } finally {

    setLoading(false);

  }

};

const handleResend = () => {

  setTimer(60);

  setOtp(["", "", "", "", "", ""]);

  inputRefs.current.forEach(input => {

    if (input) {
      input.value = "";
    }

  });

  inputRefs.current[0]?.focus();

  // Backend resend API will be connected later

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
            maxLength={1}
            value={digit}
            onChange={(e) =>
              handleChange(index, e.target.value)
            }
            onKeyDown={(e) =>
              handleKeyDown(index, e)
            }
            className="
              w-14
              h-16
              rounded-xl
              border
              border-slate-300
              text-center
              text-2xl
              font-bold
              focus:outline-none
              focus:ring-2
              focus:ring-primary
            "
          />

        ))}

</div>

<div className="text-center">

  <p className="text-sm text-slate-500 mb-4">
    Resend OTP in
  </p>

  <p className="text-2xl font-bold text-primary mb-6">
    00:{timer.toString().padStart(2, "0")}
  </p>

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
    className="flex items-center justify-center gap-2 w-full"
  >
    <RotateCcw className="w-4 h-4" />
    Resend OTP
  </Button>

</div>

</GlassCard>

</div>

</div>

);

=======
import React from "react";

const VerifyOTP = () => {
  return <div>Verify OTP</div>;
>>>>>>> ac8ae7f (Frontend Changes)
};

export default VerifyOTP;