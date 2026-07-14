import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ShieldCheck, ArrowLeft, Mail, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(() => localStorage.getItem("userEmail") || "");
  const [password, setPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem("userEmail"));

  const getPasswordStrength = () => {

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if(score <= 2) {
      return {
        label: "Weak",
        color: "bg-red-500",
      };
    }

    if(score <= 4) {
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
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  const isSignupValid =
    email.trim() &&
    isPasswordValid &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  useEffect(() => {

    const savedLogin = localStorage.getItem("isLoggedIn");

    if (savedLogin === "true") {
      navigate("/dashboard", {
        replace: true,
      });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/login' : '/signup';

    try {

      console.time("Login API");

      const controller = new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, 15000);

      const response = await fetch(
        `http://localhost:8080${endpoint}`, 
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
          },
          body: JSON.stringify({ 
            email: email.trim(), 
            password 
          }),
        signal: controller.signal,
      }
    );

      console.timeEnd("Login API");

      clearTimeout(timeout);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Something went wrong');
      }

      if (isLogin) {

        setIsSuccess(true);

        //User is Logged in regardless of Remember Me
        localStorage.setItem("isLoggedIn", "true");

        // Remember only the email if requested
        if (rememberMe) {

          localStorage.setItem("userEmail", email.trim());

        } else {

          localStorage.removeItem("userEmail");

        }
        // Navigation remains delayed to allow user to see the transition
        setTimeout(() => {  
          navigate("/dashboard", {
            replace: true
          });
        }, 1200);
          
      } else {

        setIsLogin(true);
        setError('Account created! Please log in.');

      }
    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-background-soft">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 overflow-hidden -z-0">
        <Motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary rounded-full blur-[160px]" 
        />
        <Motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            rotate: [0, -60, 0],
            opacity: [0.05, 0.15, 0.05]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] left-[-10%] w-[900px] h-[900px] bg-secondary rounded-full blur-[180px]" 
        />
      </div>

      <Motion.div 
        layout
        className={`w-full relative z-10 flex transition-all duration-700 ease-in-out ${isSuccess ? 'max-w-[1000px] gap-12' : 'max-w-[440px]'}`}
      >
        <Motion.div 
          layout
          className={`w-full ${isSuccess ? 'w-1/2' : 'w-full'}`}
        >
          <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-semibold">Back to Home</span>
          </Link>

          <div className="text-center mb-8">
            <Motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-2xl mb-6 relative"
            >
              <div className="absolute inset-0 bg-primary/20 rounded-2xl animate-ping opacity-20" />
              <ShieldCheck className="w-8 h-8 text-primary relative z-10" />
            </Motion.div>
            <Motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-slate-900 mb-2 font-outfit"
            >
              {isLogin ? 'Welcome Back' : 'Join Verbiq'}
            </Motion.h1>
            <p className="text-slate-500 font-medium">
              {isLogin 
                ? "Securely access your assessment platform" 
                : "Create your Verbiq account to begin your AI assessment."}
            </p>
          </div>

          <GlassCard className="p-8">
            <AnimatePresence mode="wait">
              <Motion.form 
                key={isLogin ? 'login' : 'signup'}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                {error && (
                  <Motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className={`p-3 rounded-xl text-sm font-medium ${error.includes('created') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {error}
                  </Motion.div>
                )}
                
                <div className="space-y-4">
                  <Input 
                    label="Email Address" 
                    type="email" 
                    icon={<Mail className="w-4 h-4" />}
                    placeholder="name@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Input 
                    label="Password" 
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Your Password" 
                    value={password}
                    onChange={(e) => { 
                      setPassword(e.target.value);

                      if (error) {
                        setError("");
                      }
                    }}
                    rightIcon={ 
                      showPassword ? (
                        <EyeOff className="w-5 h-5"/>
                      ) : (
                        <Eye className="w-5 h-5" />
                      )
                    }
                    onRightIconClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    required
                  />
                  
                  {/* Password Requirements */}
                  {!isLogin && (

                    <div className="space-y-2 text-sm">

                      <p className={`flex items-center gap-2 ${password.length >= 8 ? "text-green-600" : "text-slate-400"}`}>
                        <span>{password.length >= 8 ? "✔" : "○"}</span>
                        At least 8 characters
                      </p>

                      <p className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? "text-green-600" : "text-slate-400"}`}>
                        <span>{/[A-Z]/.test(password) ? "✔" : "○"}</span>
                        One uppercase letter
                      </p>

                      <p className={`flex items-center gap-2 ${/[a-z]/.test(password) ? "text-green-600" : "text-slate-400"}`}>
                        <span>{/[a-z]/.test(password) ? "✔" : "○"}</span>
                        One lowercase letter
                      </p>

                      <p className={`flex items-center gap-2 ${/\d/.test(password) ? "text-green-600" : "text-slate-400"}`}>
                        <span>{/\d/.test(password) ? "✔" : "○"}</span>
                        One number
                      </p>

                      <p className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(password) ? "text-green-600" : "text-slate-400"}`}>
                        <span>{/[^A-Za-z0-9]/.test(password) ? "✔" : "○"}</span>
                        One special character
                      </p>

                    </div>

                  )}

                  {!isLogin && (
                    <Input 
                      label="Confirm Password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) =>{ 
                        setConfirmPassword(e.target.value);
                      
                        if (error) {
                          setError("");
                        }
                      }}
                      rightIcon={
                        showConfirmPassword ? (
                          <EyeOff className="w-5 h-5"/>
                        ) : (
                          <Eye className="w-5 h-5" />
                        )
                      }
                      onRightIconClick={() =>
                        setShowConfirmPassword((prev) => !prev)
                      }
                      required
                    />
                  )}     

                  {!isLogin && confirmPassword.length > 0 && (

                  <div
                    className={`flex items-center gap-2 text-sm font-medium ${
                      password === confirmPassword
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >

                    <span>
                      {password === confirmPassword ? "✔" : "✖"}
                    </span>

                    <span>
                      {password === confirmPassword
                        ? "Passwords match"
                        : "Passwords do not match"}
                    </span>

                  </div>

                )}

                {!isLogin && (

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

                )}

                </div>


                {isLogin && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                      <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" 
                      />
                      <span>Remember me</span>
                    </label>
                    <button 
                      type="button" 
                      className="text-primary font-bold hover:text-primary-dark transition-colors"
                      onClick={() => navigate("/forgot-password")}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                  <Button 
                    type="submit" 
                    className="w-full py-4 text-lg font-bold shadow-lg shadow-primary/20" 
                    isLoading={loading}
                    disabled={!isLogin && (!isSignupValid || loading)}
                  >
                    {isLogin ? 'Login' : 'Create Account'}
                  </Button>
              </Motion.form>
            </AnimatePresence>
          </GlassCard>

          {!isSuccess && (
            <Motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mt-8 text-slate-500 text-sm font-medium"
            >
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button 
                onClick={() =>{ 
                  setIsLogin(!isLogin);
                  setPassword("");
                  setConfirmPassword("");
                  setError("");
                  setIsSuccess(false);
              }}
                className="text-primary font-bold hover:underline"
              >
                {isLogin ? 'Sign Up Now' : 'Sign In'}
              </button>
            </Motion.p>
          )}
        </Motion.div>

        {/* Welcome Sidebar Panel */}
        <AnimatePresence>
          {isSuccess && (
            <Motion.div 
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="hidden md:flex flex-col justify-center w-1/2"
            >
              <div className="space-y-6">
                <Motion.div
                  initial={{ width: 0 }}
                  animate={{ width: 60 }}
                  className="h-1 bg-primary rounded-full"
                />
                <h2 className="text-5xl font-bold text-slate-900 leading-tight font-outfit">
                  Welcome back to <span className="text-primary">Verbiq</span>
                </h2>
                <div className="space-y-4">
                  <p className="text-xl text-slate-600 font-medium leading-relaxed">
                    We've missed you! Your assessment insights and performance metrics are ready for review.
                  </p>
                  <Motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 border border-white shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                      IQ
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Pro Proctoring Enabled</div>
                      <div className="text-xs text-slate-500 font-medium">System checks complete and active</div>
                    </div>
                  </Motion.div>
                </div>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </Motion.div>
    </div>
  );
};

export default Login;
