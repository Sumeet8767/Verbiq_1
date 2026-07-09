import React, { useState } from "react";
import { motion as Motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail ,ShieldCheck } from "lucide-react";

import { GlassCard } from "../components/ui/GlassCard";
import  { Input } from "../components/ui/Input"
import  { Button } from "../components/ui/Button"

const ForgotPassword = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            //Backend API will be connected later

            console.log(email);

            setTimeout(() => {
                setSuccess(
                    "OTP has been sent to your registered email."
            );

            navigate("/verify-otp", {
                state: {
                    email: email.trim(),
                },
            });
            }, 1200); 
        } catch (er) {
            setError(er.message);
        } finally {
            setLoading(false);
        }
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

            <div className="relative z-10 w-full max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
                <div className="w-full max-w-md">
                <button
                    onClick={() => navigate("/login")}
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-8"
                >

                    <ArrowLeft className="w-4 h-4"/>

                    Back to Login
                </button>

                <GlassCard className="p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xl mb-6">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                        </div>

                        <h1 className="text-3xl font-bold mb-2">
                            Forgot Password
                        </h1>

                        <p className="text-slate-500">
                            Enter your registered email address to receive a verification code.
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        {error && (
                            <div className="p-3 rounded-xl bg-red-100 text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 rounded-xl bg-green-100 text-green-700 text-sm">
                                {success}
                            </div>
                        )}

                        <Input
                            label="Email Address"
                            type="email"
                            icon={<Mail className="w-4 h-4"/>}
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <Button
                            type="submit"
                            className="w-full py-4 text-lg font-bold"
                            isLoading={loading}
                        >
                            Send OTP
                        </Button>
                    </form>
                </GlassCard>
            </div>

            <div className="hidden lg:flex flex-col justify-center">

                <Motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >

                    <div className="mb-10">

                        <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-white shadow-2xl">

                            {/* Replace with Verbiq logo later */}

                            <ShieldCheck className="w-14 h-14 text-primary" />

                        </div>

                    </div>

                    <h1 className="text-5xl font-black text-slate-900 leading-tight">

                        AI Candidate
                        <br />
                        Assessment

                    </h1>

                    <p className="mt-6 text-xl text-slate-500 max-w-xl leading-9">

                        Secure AI-powered hiring platform with
                        real-time proctoring, voice assessment,
                        identity verification and intelligent
                        candidate evaluation.

                    </p>

                    <div className="mt-12 space-y-6">

                        <Feature text="AI Face Verification" />

                        <Feature text="Voice Assessment" />

                        <Feature text="Real-Time Proctoring" />

                        <Feature text="End-to-End Encryption" />

                    </div>

                </Motion.div>

            </div>
          </div>
       </div> 
    );
};

const Feature = ({ text }) => (

    <div className="flex items-center gap-4">

        <div className="w-3 h-3 rounded-full bg-green-500" />

        <span className="text-lg font-semibold text-slate-700">

            {text}

        </span>

    </div>

);

export default ForgotPassword;