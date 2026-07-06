import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Camera, 
  Mic, 
  MonitorOff, 
  AlertTriangle, 
  ChevronRight, 
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { assessmentApi } from '../utils/api';

const Instructions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checks, setChecks] = useState({
    camera: false,
    mic: false,
    screen: false
  });
  const [requesting, setRequesting] = useState({
    media: false,
    screen: false
  });


  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState('');
  
  const requestMediaPermissions = async () => {
    setRequesting(prev => ({ ...prev, media: true }));
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setChecks(prev => ({ ...prev, camera: true, mic: true }));
      // Stop tracks immediately after verification to release devices
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Permission denied", err);
      setError('Camera or Microphone access was denied. Please allow them in your browser settings.');
    } finally {
      setRequesting(prev => ({ ...prev, media: false }));
    }
  };

  const requestScreenShare = async () => {
    setRequesting(prev => ({ ...prev, screen: true }));
    setError('');
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: {
          displaySurface: "monitor"
        } 
      });
      
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      
      // Check if it's "monitor" (Entire Screen)
      // Some browsers might not support displaySurface in settings, 
      // but if they do, we should enforce it.
      if (settings.displaySurface && settings.displaySurface !== 'monitor') {
        track.stop();
        setError('Screen sharing is required to be "Entire Screen". Please try again and select the whole screen.');
        setChecks(prev => ({ ...prev, screen: false }));
        return;
      }

      setChecks(prev => ({ ...prev, screen: true }));
      // Keep track of the stream if needed, or stop it for verification
      track.stop();
    } catch (err) {
      console.error("Screen share denied", err);
      setError('Screen sharing is required to proceed. Please select "Entire Screen".');
    } finally {
      setRequesting(prev => ({ ...prev, screen: false }));
    }
  };


  const allPassed = checks.camera && checks.mic && checks.screen;

  const startAssessment = async () => {

    setLoadingQuestions(true);

    try {
      
      console.log("Calling generateQuestions...");

      const data = 
        await assessmentApi.generateQuestions(
          location.state?.lang || "en"
        );

      console.log("Questions Received:", data);

      try {
        const elem = document.documentElement;

        if (elem && elem.requestFullscreen) {
          await elem.requestFullscreen();
        }
      } catch (err) {
        console.warn("Fullscreen Failed:", err);
      }

      navigate("/assessment", {
        state: {
          questions : data
        }
      });
    } catch (err) {

      console.error("Full Error:",err);

      console.error(err.stack);

      setError(err.message || "Unable to start assessment.");

    } finally {

      setLoadingQuestions(false);
    }
  };

  const rules = [
    {
      icon: <Camera className="w-6 h-6 text-blue-500" />,
      title: "Live Proctoring",
      desc: "Your webcam and audio will be monitored throughout the session."
    },
    {
      icon: <MonitorOff className="w-6 h-6 text-red-500" />,
      title: "No Tab Switching",
      desc: "Switching tabs or windows will be flagged as suspicious activity."
    },
    {
      icon: <Clock className="w-6 h-6 text-amber-500" />,
      title: "Timed Assessment",
      desc: "The test is 20 minutes long. Questions must be submitted before time runs out."
    },
    {
      icon: <Lock className="w-6 h-6 text-emerald-500" />,
      title: "Quiet Environment",
      desc: "Ensure you are in a quiet, well-lit room with no other people."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 selection:bg-primary/20">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <Motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm mb-4"
          >
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Verified Session</span>
          </Motion.div>
          <Motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 font-outfit mb-4"
          >
            Ready to Begin?
          </Motion.h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Please complete the system checks below to ensure your hardware is ready for the proctored assessment.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rules Section */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Core Guidelines
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules.map((rule, i) => (
                <Motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <GlassCard className="p-6 h-full border-none shadow-md hover:shadow-xl transition-all duration-300 group">
                    <div className="p-3 bg-slate-50 rounded-2xl w-fit mb-4 group-hover:bg-primary/5 transition-colors">
                      {rule.icon}
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">{rule.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{rule.desc}</p>
                  </GlassCard>
                </Motion.div>
              ))}
            </div>

            <GlassCard className="p-6 bg-primary/5 border-primary/10 border mt-8">
              <div className="flex gap-4">
                <div className="w-1 bg-primary rounded-full" />
                <div>
                  <h4 className="font-bold text-primary mb-1">Important Allowance</h4>
                  <p className="text-sm text-slate-600">
                    You must allow <b>Camera</b>, <b>Microphone</b>, and <b>Entire Screen Share</b> to start. Failure to do so will block the assessment.
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* System Check Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              System Status
            </h2>
            <GlassCard className="p-6 space-y-6 border-none shadow-lg">
              <div className="space-y-5">
                <StatusItem 
                  label="Camera & Mic Access" 
                  checked={checks.camera && checks.mic} 
                  loading={requesting.media}
                />
                <StatusItem 
                  label="Screen Sharing Verified" 
                  checked={checks.screen} 
                  loading={requesting.screen}
                />
                
                <div className="h-[1px] bg-slate-100 my-2" />
                
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 flex gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    variant={checks.camera && checks.mic ? 'secondary' : 'primary'}
                    onClick={requestMediaPermissions}
                    disabled={checks.camera && checks.mic}
                    className="w-full text-sm py-3 justify-between group"
                  >
                    <span>{checks.camera && checks.mic ? 'Permissions Granted' : 'Allow Camera & Mic'}</span>
                    {!checks.camera && <Camera className="w-4 h-4 opacity-50" />}
                    {checks.camera && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </Button>
                  
                  <Button 
                    variant={checks.screen ? 'secondary' : 'primary'}
                    onClick={requestScreenShare}
                    disabled={checks.screen}
                    className="w-full text-sm py-3 justify-between group"
                  >
                    <span>{checks.screen ? 'Screen Shared' : 'Share Entire Screen'}</span>
                    {!checks.screen && <MonitorOff className="w-4 h-4 opacity-50" />}
                    {checks.screen && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {allPassed && (
                  <Motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-6 border-t border-slate-100"
                  >
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold mb-4">
                      <ShieldCheck className="w-4 h-4" />
                      Verification Complete
                    </div>

                    {loadingQuestions ? (
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl mb-6 border border-slate-100 animate-pulse">
                         <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                         <span className="text-sm font-bold text-slate-500 font-outfit">Preparing your personalized questions...</span>
                      </div>
                    ) : (

                      <Button
                        onClick={startAssessment}
                        disabled={!allPassed}
                        className="w-full"
                      >
                        Start Assessment
                      </Button>
                    
                    )}
                  </Motion.div>
                )}
              </AnimatePresence>
            </GlassCard>

            <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden group">
               <div className="relative z-10">
                 <h4 className="font-bold mb-2">Technical Support</h4>
                 <p className="text-xs text-slate-400 leading-relaxed mb-4">
                   Granting permissions is mandatory for proctoring. Please use Chrome or Edge for the best experience.
                 </p>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusItem = ({ label, checked, loading }) => (
  <div className="flex items-center justify-between">
    <span className={`text-sm font-medium ${checked ? 'text-slate-400' : 'text-slate-700'}`}>{label}</span>
    {loading ? (
      <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    ) : (
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center",
        checked ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-300"
      )}>
        <CheckCircle2 className="w-3.5 h-3.5" />
      </div>
    )}
  </div>
);

// Helper for conditional classes if not already imported
const cn = (...classes) => classes.filter(Boolean).join(' ');

export default Instructions;
