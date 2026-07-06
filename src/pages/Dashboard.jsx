import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  ChevronRight, 
  ShieldCheck, 
  Camera, 
  Mic,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    middle_name: '',
    surname: '',
    contact: '',
    mail: localStorage.getItem('userEmail') || '',
    language: 'English',
    address: ''
  });

  const [systemCheck, setSystemCheck] = useState({
    camera: 'pending',
    mic: 'pending',
    internet: 'pending'
  });

  useEffect(() => {
    if (step === 2) {
      // Simulate system checks
      const timer = setTimeout(() => {
        setSystemCheck({
          camera: 'success',
          mic: 'success',
          internet: 'success'
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    
    setLoading(true);

    const start = performance.now();

    try {
      const controller = new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, 5000);

      const response = await fetch(
        "http://localhost:8080/save-candidate-info",
        {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify(formData),
         signal: controller.signal, 
        }
      );

      console.log(
        "Response Status:",
        response.status
      );

      clearTimeout(timeout);

      const apiEnd = performance.now();

      console.log(
        "API Time:",
        apiEnd - start,
        "ms"
      );

      const navStart = performance.now();

      navigate("/language-slection", {
        replace: true,
      });

      console.log(
        "Navigate Time:",
        performance.now() - navStart,
        "ms"
      );

      if (!response.ok) {
        throw new Error("Unable to save Candidate.");
      }
      navigate("/language-selection", {
        replace: true,
      });

      setLoading(false);

    } catch (err) {
        console.error("FULL ERROR:",err);

        alert(
          "unable to Continue.\n\n" +
          err.message
        );

        setLoading(false);
    }
  };

  const steps = [
    { id: 1, label: 'Profile' },
    { id: 2, label: 'System Check' }
  ];

  return (
    <div className="min-h-screen bg-background-soft flex items-center justify-center p-6 md:p-12 relative overflow-hidden">

     {loading && (
      <div className="
        fixed
        inset-0
        z-[999999]
        bg-white/90
        backdrop-blur-md
        flex
        items-center
        justify-center
      "
      >
        <div className="text-center">
          <div className="
            w-16
            h-16
            border-4
            border-primary
            border-t-transparent
            rounded-full
            animate-spin
            mx-auto
            mb-6
            "
          />

          <h2 className="text-2xl font-bold">
            Preparing Assessment...
          </h2>

          <p className="text-slate-500 mt-2">
            Saving your information...
          </p>
          </div>
        </div>
     )}

      {/* Background Blobs */}
      
      {/* Premium Aurora Background */}
      <div className="absolute inset-0 overflow-hidden -z-20">

        {/* Red Aurora */}

        <Motion.div 
          animate={{
            x: [0, 80, 0],
            y: [0, -60, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="
          absolute
          -top-40
          -left-40 
          w-[900px]
          h-[900px]
          rounded-full
          bg-red-500/20
          blur-[180px]
          "
        />

        {/* Cyan Aurora */}
        
        <Motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="
          absolute
          -bottom-52
          -right-52
          w-[900px]
          h-[900px]
          rounded-full
          bg-cyan-400/20
          blur-[180px]
          "
        />

        {/* Center Glow */}

        <Motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="
          absolute
          top-1/2
          left-1/2
          -translate-x-1/2
          -translate-y-1/2
          w-[450px]
          h-[450px]
          rounded-full
          bg-primary/10
          blur-[140px]
          "
        />
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Side: Progress & Info */}
        <div className="lg:col-span-4 space-y-8">
          <Motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-xl
            bg-white/70 backdrop-blur-xl border border-white/30
            text-slate-600 hover:text-primary hover:shadow-lg
            transition-all duration-300 hover:-translate-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
            </button>

            <GlassCard className="p-6 overflow-hidden relative">

              {/* Background Glow */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />

              <div className="relative z-10">

                <div className="flex items-center gap-4 mb-6">

                  <div 
                    className="
                    relative
                    w-16
                    h-16
                    rounded-2xl
                    bg-gradient-to-br
                    from-primary
                    to-secondary
                    flex
                    items-center
                    justify-center
                    shadow-xl
                    shadow-primary/30
                    "
                  >
                    <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl animate-pulse"/>

                    <ShieldCheck className="relative w-8 h-8 text-white"/>

                  </div>

                  <div>

                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">

                      AI SESSION

                    </p>

                    <h3 className="text-xl font-bold">

                      Assessment Ready

                    </h3>

                  </div>

                </div>

                {/* Progress */}

                <div className="mb-6">

                  <div className="flex justify-between text-sm mb-2">

                    <span className="text-slate-500">

                      Session Ready

                    </span>

                    <span className="font-bold text-green-500">

                      98%

                    </span>

                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">

                    <Motion.div

                      initial={{ width: 0 }}

                      animate={{ width: "98%" }}

                      transition={{ duration: 1.5 }}

                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"

                    />

                  </div>

                </div>

                {/* Status */}

                <div className="space-y-3">

                  {[
                    "Encrypted Session",
                    "Candidate Verified",
                    "Ready to Launch"
                  ].map((item) => (

                    <div
                      key={item}
                      className="flex items-center justify-between"
                    >

                      <span className="text-slate-600">

                        {item}

                      </span>

                      <span className="text-green-500 font-semibold">

                        ✓

                      </span>

                    </div>

                  ))}

                </div>

              </div>

            </GlassCard>
            <div className="mt-6 space-y-5">

              <h1 className="text-5xl font-black leading-tight">
                AI Candidate
                <br />
                <span className="bg-gradient-to-r from-primary via-red-500 to-secondary bg-clip-text text-transparent">
                  Dashboard
                </span>
              </h1>

              <p className="text-slate-500 leading-relaxed text-lg">
                Configure your secure AI-powered assessment 
                environment before launching your interview.
              </p>

              <div className="mt-6 w-24 h-1 rounded-full bg-gradient-to-r from-primary to-secondary"/>
              <p className="mt-5 text-sm uppercase tracking-[0.3em] text-slate-400 font-semibold">
                Secure Assessment Workspace
              </p>
            </div>
          </Motion.div>

          {/* <div className="space-y-4">
            {steps.map((s) => (
              <div key={s.id} className="flex items-center gap-4 group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  step === s.id ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 
                  step > s.id ? 'bg-green-500 text-white' : 'bg-white text-slate-400 border border-slate-200'
                }`}>
                  {step > s.id ? <CheckCircle2 className="w-6 h-6" /> : s.id}
                </div>
                <span className={`font-semibold ${step === s.id ? 'text-slate-900' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div> */}

          <div className="relative">
            {steps.map((s, index) => (
              <div
                key={s.id}
                className="relative flex items-start gap-4 pb-6 last:pb-0"
                >
                  {/* Vertical Line */}

                  {index !== steps.length - 1 && (
                    <div
                      className="
                      absolute
                      left-5 -translate-x-1/2
                      top-10
                      bottom-0
                      w-[2px]
                      h-14
                      -translate-x-1/2
                      bg-slate-200
                      "
                    />
                  )}
                  {/* Circle */}

                  <Motion.div

                    whileHover={{
                      y: -8,
                      scale:1.01,
                    }}

                    className={`
                    relative
                    z-10
                    w-10
                    h-10
                    rounded-full
                    flex
                    items-center
                    justify-center
                    font-bold
                    transition-all

                    ${
                      step === s.id
                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                        : step > s.id
                        ? "bg-green-500 text-white"
                        : "bg-white border border-slate-200 text-slate-400"
                    }
                    `}
                  >
                    {step > s.id ? (
                      <CheckCircle2 className="w-5 h-5"/>
                    ) : (
                      <span>
                      {s.id}
                      </span>
                    )}
                  </Motion.div>

                  {/* Text */}
                  <div className="pt-1">

                    <h4
                      className={`
                        font-semibold
                        
                        ${
                          step === s.id
                          ? "text-slate-900"
                          : "text-slate-400"
                        }
                        `}
                      >
                        {s.label}
                      </h4>

                      <p className="text-xs text-slate-400 mt-0.5">
                        {s.id === 1
                        ? "Complete your profile"
                        : "Verify your hardware"}
                      </p>
                    </div>
                  </div>
            ))}
          </div>

          {/* ========== AI STATUS CARD START ========== */}

          <GlassCard className="mt-6 p-7">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">
                AI Status
              </h3>

              <Motion.div 
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [1, 0.5, 1]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5
                }}
                className="w-3 h-3 rounded-full bg-green-500"
              />

            </div>

            {[
              "Face",
              "Camera",
              "Microphone",
              "Security"
            ].map((item) => (

              <div
                key={item}
                className="
                flex
                items-center
                justify-between
                gap-3
                py-3
                border-b
                border-slate-100
                last:border-0
                "
              >

                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"/>
                  <span className="font-medium text-slate-700">
                    {item}
                  </span>
                </div>

                <span className="text-green-500 font-semibold">
                  Active
                </span>
              </div>
            ))}

            <div className="mt-5 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Overall Status
              </p>

              <h2 className="text-2xl font-bold text-green-600">
                READY
              </h2>
            </div>
          </GlassCard>
          {/* ========== AI STATUS CARD END ========== */}
        </div>

        {/* Right Side: Form / Content */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <Motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <GlassCard className="p-8">
                  
                  {/* Candidate Profile Header */}

                  <div className="flex items-start justify-between mb-10">

                    <div>
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                      Candidate Profile
                      </span>

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary"/>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 font-outfit">
                          Complete Your Profile
                        </h2>
                      </div>
                      <p className="text-slate-500 mt-2 max-w-lg">
                        Your information is encrypted and used only to personalize your AI-powered assessment.
                      </p>
                    </div>

                    <div className="hidden md:flex flex-col items-end">

                      <span className="text-xs uppercase tracking-widest text-slate-400">
                        Security
                      </span>

                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-green-500"/>
                        <span className="text-green-600 font-bold">
                          AI Verified
                        </span>
                      </div>
                    </div>

                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Input 
                        label="First Name" 
                        name="name"
                        icon={<User className="w-4 h-4" />}
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John" 
                        required
                      />
                      <Input 
                        label="Surname" 
                        name="surname"
                        icon={<User className="w-4 h-4" />}
                        value={formData.surname}
                        onChange={handleChange}
                        placeholder="Doe" 
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input 
                        label="Email Address" 
                        name="mail"
                        type="email"
                        icon={<Mail className="w-4 h-4" />}
                        value={formData.mail}
                        onChange={handleChange}
                        placeholder="john.doe@example.com" 
                        required
                      />
                      <Input 
                        label="Contact Number" 
                        name="contact"
                        icon={<Phone className="w-4 h-4" />}
                        value={formData.contact}
                        onChange={handleChange}
                        placeholder="+1 (555) 000-0000" 
                        required
                      />
                    </div>

                    <div className="space-y-2">
                       <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                         <MapPin className="w-4 h-4" /> Address / City
                       </label>
                       <Input 
                         name="address"
                         value={formData.address}
                         onChange={handleChange}
                         placeholder="e.g. New York, USA" 
                         className="bg-white/50"
                         required
                       />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full py-5 text-lg font-bold group" 
                    >
                      Continue to System Check
                      <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </form>
                </GlassCard>
              </Motion.div>
            ) : (
              <Motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <GlassCard className="p-8">
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-slate-800 mb-2 font-outfit">Hardware Verification</h3>
                    <p className="text-slate-500">Checking your devices for the proctored session...</p>
                  </div>

                  <div className="space-y-4 mb-10">
                    {[
                      { icon: <Camera />, label: 'Camera Access', status: systemCheck.camera },
                      { icon: <Mic />, label: 'Microphone Quality', status: systemCheck.mic },
                      { icon: <Globe />, label: 'Network Stability', status: systemCheck.internet },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/50 border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl ${item.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                            {item.icon}
                          </div>
                          <span className="font-semibold text-slate-700">{item.label}</span>
                        </div>
                        {item.status === 'success' ? (
                          <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                            <CheckCircle2 className="w-4 h-4" /> Ready
                          </div>
                        ) : (
                          <div className="w-5 h-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button 
                      onClick={handleSubmit} 
                      className="flex-[2] py-5 text-lg font-bold"
                      disabled={Object.values(systemCheck).some(s => s !== 'success')}
                      isLoading={loading}
                    >
                      Start Assessment Selection
                    </Button>
                  </div>
                </GlassCard>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
