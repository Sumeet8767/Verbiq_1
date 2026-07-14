import React, { useState, useEffect } from "react";
import { motion as Motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

import {
    ArrowLeft,
    ShieldCheck,
    Eye,
    EyeOff,
} from "lucide-react";

import { GlassCard } from "../components/ui/GlassCard";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success] = useState(false);

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
        navigate("/login", {
            replace: true,
        });
    }, 1800);
    return () => clearTimeout(timer);
  }, [success, navigate]);

const getPasswordStrength = () => {

    let score = 0;

    if (newPassword.length >= 8) score++;

    if (/[A-Z]/.test(newPassword)) score++;

    if (/[a-z]/.test(newPassword)) score++;

    if (/\d/.test(newPassword)) score++;

    if (/[^A-Za-z0-9]/.test(newPassword)) score++;



    if (score <= 2) {
        return {
            label: "Weak",
            color: "bg-red-500",
        };
    }

    if (score <= 4) {
        return {
            label: "Medium",
            color: "bg-yellow-500",
        };
    }

    return {
        label: "Strong",
        color: "bg-green-500",
    };
};

const strength = getPasswordStrength();

const isPasswordValid =
    newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /[a-z]/.test(newPassword) &&
    /\d/.test(newPassword) &&
    /[^A-Za-z0-9]/.test(newPassword);

const isFormValid = 
    isPasswordValid &&
    newPassword === confirmPassword &&
    confirmPassword.length > 0;

const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!isPasswordValid) {
        setError("Please create a stronger password.");
        return;
    }

    if (newPassword !== confirmPassword) {
        setError("Passwords do not match.");
        return;
    }
    setError("");
    setLoading(true);

    try {
        const response = await fetch(
            "http://localhost:8080/reset-password",
            {
                method: "POST",
                headers: {
                    "Content-Type" : "application/json",
                },
                body : JSON.stringify({
                    email,
                    new_password: newPassword,
                }),
            }
        );

        const data = await response.json();

        console.log("Response Status:", response.status);
        console.log("Response Ok:", response.ok);
        console.log("Response Data:", data);

        if (!response.ok) {
            throw new Error(data.detail || "Password reset failed.");
        }

        // console.log("About to set success...");
        
        alert("Password reset successfull!");

        navigate("/login", {
            replace: true,
        });

        // console.log("Success state requested.");

    } catch (err) { 
        setError(err.message);
    } finally {
        setLoading(false);
    }
};

    console.log("Current success:", success);

    if (success) {
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
                <GlassCard className="relative z-10 p-10 max-w-md w-full text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 shadow-lg mb-6">
                    <ShieldCheck className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold mb-3">
                    Password Updated!
                    </h2>
                    <p className="text-slate-500 mb-6">
                    Your password has been changed successfully.
                    </p>
                    <p className="text-primary font-semibold">
                    Redirecting to Login...
                    </p>
                </GlassCard>
                </div>
            );
        }

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
                onClick={() => navigate("/verify-otp", {
                    state: { email },
                })}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-8"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

        <GlassCard className="p-8">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xl mb-6">
                    <ShieldCheck className="w-8 h-8 text-primary"/>
                </div>
                <h1 className="text-3xl font-bold mb-3">
                    Reset Password
                </h1>
                <p className="text-slate-500">
                    Create a new secure password for
                </p>
                <p className="font-semibold text-primary mt-2">
                    {email}
                </p>

            </div>

            {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="space-y-6"
            >

                <Input
                    label="New Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new Password"
                    value={newPassword}
                    onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (error) {
                            setError("");
                        }
                    }}
                    rightIcon={
                        showPassword ? (
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )
                    }
                    onRightIconClick={() => 
                        setShowPassword((prev) => !prev)
                    }
                    required
                />

                <div className="space-y-1 text-sm">
                    
                    <p 
                        className={`flex items-center gap-2 ${
                            newPassword.length >= 8
                            ? "text-green-600"
                            : "text-slate-400"
                        }`}
                    >
                        <span>
                            {newPassword.length >= 8 ? "✓" : "○"}
                        </span>
                        At least 8 characters
                    </p>
                    
                    <p 
                        className={`flex items-center gap-2 ${
                            /[A-Z]/.test(newPassword)
                            ? "text-green-600"
                            : "text-slate-400"
                        }`}
                    >
                        <span>
                            {/[A-Z]/.test(newPassword) ? "✓" : "○"}
                        </span>
                        One uppercase letter
                    </p>
                    
                    <p 
                        className={`flex items-center gap-2 ${
                            /[a-z]/.test(newPassword)
                            ? "text-green-600"
                            : "text-slate-400"
                        }`}
                    >
                        <span>
                            {/[a-z]/.test(newPassword) ? "✓" : "○"}
                        </span>
                        One lowercase letter
                    </p>
                    
                    <p 
                        className={`flex items-center gap-2 ${
                            /\d/.test(newPassword)
                            ? "text-green-600"
                            : "text-slate-400"
                        }`}
                    >
                        <span>
                            {/\d/.test(newPassword) ? "✓" : "○"}
                        </span>
                        One number
                    </p>
                    
                    <p 
                        className={`flex items-center gap-2 ${
                            /[^A-Za-z0-9]/.test(newPassword)
                            ? "text-green-600"
                            : "text-slate-400"
                        }`}
                    >
                        <span>
                            {/[^A-Za-z0-9]/.test(newPassword) ? "✓" : "○"}
                        </span>
                        One special character
                    </p>
                </div>

                <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? "text" : "Password"}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) {
                            setError("");
                        }
                    }}
                    rightIcon={
                        showConfirmPassword ? (
                            <EyeOff className="w-5 h-5"/>
                        ) : (
                            <Eye className="w-5 h-5"/>
                        )
                    }
                    onRightIconClick={() => 
                        setShowConfirmPassword((prev) => !prev)
                    }
                    required
                />

                {confirmPassword.length > 0 && (
                    <div 
                        className={`flex items-center gap-2 text-sm font-medium ${
                            newPassword === confirmPassword
                                ? "text-green-600"
                                : "text-red-500"
                        }`}
                    >
                        <span>
                            {newPassword === confirmPassword ? "✔" : "✖"}
                        </span>

                        <span>
                            {newPassword === confirmPassword
                                ? "Passwords match"
                                : "Passwords do not match"}
                        </span>
                    </div>
                )}

                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span>Password Strength</span>
                        <span className="font-semibold">
                            {strength.label}
                        </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                            className={`h-full ${strength.color}`}
                            style={{
                                width:
                                    strength.label === "Weak"
                                        ? "33%"
                                        : strength.label === "Medium"
                                        ? "66%"
                                        : "100%",
                            }}
                        />
                    </div>
                </div>

                <Button 
                    type="submit"
                    className="w-full py-4 text-lg font-bold"
                    isLoading={loading}
                    disabled={!isFormValid || loading}
                >
                    Reset Password
                </Button>
            </form>
        </GlassCard>
    </div>
</div>
);
};
export default ResetPassword;

