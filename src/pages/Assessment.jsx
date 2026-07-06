import React, { useState, useEffect, useRef} from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  Clock, 
  Mic, 
  Square, 
  Send,
  Volume2,
  FileText,
  Type,
  Ear
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { cn } from '../utils/cn';
import { assessmentApi, proctoringApi } from '../utils/api';
 
const Assessment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1200); // 20 mins
  const [bookmarked, setBookmarked] = useState(new Set());
  const [proctoringSession, setProctoringSession] = useState(null);
  const [suspiciousCount, setSuspiciousCount] = useState(0);
  const [lastWarning, setLastWarning] = useState("");
  const [_isPlaying, _setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage] = useState(searchParams.get('lang') || 'English');
  const questions = location.state?.questions || [];
  const loading =
    !location.state ||
    !Array.isArray(location.state.questions);
  
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalReason, setModalReason] = useState("");

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [markedForReview, setMarkedForReview] = useState({});
  
  // Refs for tracking state inside intervals
  const showModalRef = useRef(false);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const audioStreamRef = useRef(null);
  const answerRecordingStreamRef = useRef(null);

  const lastViolationRef = useRef(0)
  const lastBackendWarningRef = useRef(0)

  const isSubmittingRef = useRef(false);
  const detectionRunningRef = useRef(false);

  const currentQuestion = questions[currentIdx];

  const solvedCount = Object.keys(answers).length;

  const unsolvedCount = 
    questions.length - solvedCount;

  const reviewCount = 
    Object.values(markedForReview)
    .filter(Boolean)
    .length;


  const proctoringStartedRef = useRef(false);

  const progressPercentage = 
    questions.length > 0
      ? (solvedCount / questions.length) * 100
      : 0;

  const handleAutoFinish = async (reason) => {

    isSubmittingRef.current = true;
    setIsSubmitting(true);
  
    // Stop camera and microphone
    if (audioStreamRef.current) {

      audioStreamRef.current
        .getTracks()
        .forEach(track => track.stop());

      audioStreamRef.current = null;
    }

    // Stop answer recording stream
    if (answerRecordingStreamRef.current) {

      answerRecordingStreamRef.current
          .getTracks()
          .forEach(track => track.stop());
  
      answerRecordingStreamRef.current = null;
  }
  
    // Remove video stream
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  
    // Stop frame detection
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  
    // Exit fullscreen
    try {
      if (document.fullscreenElement){
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Failed to exit fullscreen:", err);
    }

    showModalRef.current = false;
    setShowModal(false);
    setShowWarning(false);
  
    navigate('/completion', {
      state: {
        answers,
        timeTaken: 1200 - timeLeft,
        terminated: true,
        reason: reason
      }
    });
  
  };

  const handleSecurityViolation = (reason) => {
    /*setSuspiciousCount(prev => {
      const newCount = prev + 1;

      if (newCount >= 3) {
        handleAutoFinish(reason);
        return newCount;
      }

      setModalReason(reason);
      setShowModal(true);
      showModalRef.current = true;

      return newCount;
    });*/

    const now = Date.now();

    if (
      now - lastViolationRef.current < 5000
    ) {
      return;
    }

    lastViolationRef.current = now;

    setSuspiciousCount(prev => {

      const newCount = prev + 1;

      if (newCount >= 3) {
        handleAutoFinish(reason);
        return newCount;
      }

      setModalReason(reason);
      setShowModal(true);
      showModalRef.current = true;

      return newCount
    });
  };

  const initProctoring = async () => {
    try {
      audioStreamRef.current =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

      console.log("Camera stream started");

      const stream = audioStreamRef.current;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      console.log("Video attached");
      
      const session = await proctoringApi.startRecording();
      setProctoringSession(session.session_id);

      detectionIntervalRef.current = setInterval(async () => {
        if (showModalRef.current) return;
        
        if (videoRef.current) {

          if (!canvasRef.current) return;
          if (!videoRef.current.videoWidth) return; 

          const canvas = canvasRef.current;

          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoRef.current, 0, 0);
          
          canvas.toBlob(async (blob) => {

            if (!blob) return;

            if (detectionRunningRef.current) return;

            detectionRunningRef.current = true;

              try {
                const result = await proctoringApi.detectFrame(blob);

                if (result.terminate){

                  clearInterval(detectionIntervalRef.current);
                  detectionIntervalRef.current = null;

                  handleAutoFinish(result.warning);
                  return;
                }

                if (result.suspicious) {

                  const now = Date.now();

                  if (
                    now - lastBackendWarningRef.current < 5000
                  ) {
                    return;
                  }

                  lastBackendWarningRef.current = now;

                  const warningText =
                    result.warning || "Suspicious activity detected. Please stay focused.";
                
                  setLastWarning(warningText);
                
                  setSuspiciousCount(prev => {
                    const newCount = prev + 1;
                
                    if (newCount >= 3) {
                      handleAutoFinish("Security Violation: Multiple suspicious activities detected.");
                    } else {
                      setModalReason(warningText);
                      setShowModal(true);
                      showModalRef.current = true;
                      
                      setWarningMessage(warningText);
                      setShowWarning(true);
                      showModalRef.current = true;
                    }
                
                    return newCount;
                  });
                }
              } catch (err) {
                console.error("Detection error:", err);
              }
              finally {
                detectionRunningRef.current = false;
              }
          }, "image/jpeg");
        }
      }, 1200);
    } catch (err) {
      console.error("Webcam initialization failed:", err);
    }
  };

  useEffect(() => {
    if (
        location.state?.questions &&
        !proctoringStartedRef.current
    ) {
      proctoringStartedRef.current = true;
      initProctoring();
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (selectedLanguage && !loading) {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [selectedLanguage, loading]);

  useEffect(() => {
    return () => {
  
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
  
      if (audioStreamRef.current) {
        audioStreamRef.current
          .getTracks()
          .forEach(track => track.stop());
  
        audioStreamRef.current = null;
      }

      if (answerRecordingStreamRef.current) {

        answerRecordingStreamRef.current
          .getTracks()
          .forEach(track => track.stop());

        answerRecordingStreamRef.current = null;
      }
  
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
  
    };
  }, []);

useEffect(() => {
  if (timeLeft === 0) {
    handleFinish();
  }
}, [timeLeft]);

useEffect(() => {
  const handleFullscreenExit = () => {
    if (
      !document.fullscreenElement &&
      !isSubmittingRef.current
    ) {
      handleSecurityViolation("Fullscreen mode exited.");

    }
  };   // <-- THIS LINE IS VERY IMPORTANT

  document.addEventListener(
    "fullscreenchange",
    handleFullscreenExit
  );

  return () => {
    document.removeEventListener(
      "fullscreenchange",
      handleFullscreenExit
    );
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

useEffect(() => {
  const handleVisibilityChange = () => {
    if(document.hidden) {
      handleSecurityViolation(
        "Tab Switching detected."
      );
    }
  };

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
  );

return () =>
  document.removeEventListener(
    "visibilitychange",
    handleVisibilityChange
  );
}, []);

useEffect(() => {
  const handleBlur = () => {
    handleSecurityViolation(
      "Window focus lost."
    );
  };

  window.addEventListener(
    "blur",
    handleBlur
  );

  return () =>
    window.removeEventListener(
      "blur",
      handleBlur
    );
}, []);

useEffect(() => {

  const preventCopy = (e) => e.preventDefault();
  const preventPaste = (e) => e.preventDefault();

  document.addEventListener("copy", preventCopy);
  document.addEventListener("paste", preventPaste);
  document.addEventListener("cut", preventPaste);

  return () => {
    document.removeEventListener("copy", preventCopy);
    document.removeEventListener("paste", preventPaste);
  };
}, []);

useEffect(() => {

  const preventContextMenu = (e) => {
    e.preventDefault();
  };

  document.addEventListener(
    "contextmenu",
    preventContextMenu
  );

  return () =>
    document.removeEventListener(
      "contextmenu",
      preventContextMenu
    );
}, []);

useEffect(() => {

  const handleBeforeUnload = (e) => {

    if (isSubmittingRef.current) return;

    if (showSubmitModal) return;

    e.preventDefault();
    e.returnValue = "";

  };

  window.addEventListener(
    "beforeunload",
    handleBeforeUnload
  );

  return () =>
    window.removeEventListener(
      "beforeunload",
      handleBeforeUnload
    );

}, []);

useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === "F5") {
        e.preventDefault();
        handleSecurityViolation("Refresh attempt detected.");
    }

    if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "r"
    ) {
      e.preventDefault();
      handleSecurityViolation("Refresh attempt detected.");
    }

  };

  window.addEventListener("keydown", handleKeyDown);

  return () => 
    window.removeEventListener("keydown", handleKeyDown);
}, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (val) => {

    if (!currentQuestion) return;

    setAnswers(prev => ({
      ...prev, 
      [currentQuestion.id]: val
    }));
  };

  const toggleBookmark = () => {
    const newBookmarks = new Set(bookmarked);
    if (newBookmarks.has(currentIdx)) newBookmarks.delete(currentIdx);
    else newBookmarks.add(currentIdx);
    setBookmarked(newBookmarks);
  };

  useEffect(() => {
    let audioInterval;
    if (proctoringSession && !loading) {
      audioInterval = setInterval(async () => {
        if (showModalRef.current) return;
        
        try {
          const status = await proctoringApi.getStatus(proctoringSession);
          if (status.suspicious) {

            const now = Date.now();

            if (now - lastBackendWarningRef.current < 5000 ) {
              return;
            }

            lastBackendWarningRef.current = now;

             setSuspiciousCount(prev => {
                const newCount = prev + 1;
                if (newCount >= 3) {
                  handleAutoFinish(`Security Violation: ${status.warning || "Multiple audio violations detected."}`);
                } else {
                  const warningText = status.warning || "Sensitive audio detected.";

                  setLastWarning(warningText);
                  setModalReason(warningText);
                  setShowModal(true);
                  showModalRef.current = true;
                }
                return newCount;
             });
          }
        } catch (err) {
          console.error("Audio polling error:", err);
        }
      }, 5000);
    }
    return () => {
      if (audioInterval) clearInterval(audioInterval);
    };
  }, [proctoringSession, loading]);

  const handleFinish = async () => {

    isSubmittingRef.current = true;
    setIsSubmitting(true);
  
    // Stop camera and microphone
    if (audioStreamRef.current) {

      audioStreamRef.current
        .getTracks()
        .forEach(track => track.stop());

      audioStreamRef.current = null;
    }

    // Stop answer recording stream
    if (answerRecordingStreamRef.current) {

      answerRecordingStreamRef.current
          .getTracks()
          .forEach(track => track.stop());
  
      answerRecordingStreamRef.current = null;
  }
  
    // Remove video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  
    // Stop detection loop
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  
    console.log(
      "FullScreen:",
      document.fullscreenElement
    );
  
    // Exit fullscreen
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Exit Fullscreen Failed:", err);
    }

    navigate("/completion", {
      state: {
        answers,
        timeTaken: 1200 -timeLeft
      }
    });
  };

  if (
    selectedLanguage &&
    !loading &&
    (questions.length === 0 || !currentQuestion)
  )
  
  {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto md-4" />
          <p className="font-bold">
            Loading Assessment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-outfit">
      {/* Warning Modal */}
      <AnimatePresence>
        {showModal && (
          <Motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <Motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border border-red-100"
            >
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Square className="w-10 h-10 text-red-600 fill-current" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Security Warning</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">
                {modalReason} <br/> 
                <span className="font-bold text-red-600">Strike {suspiciousCount} of 3</span>
              </p>
              <Button 
                onClick={async () => {

                  if(!document.fullscreenElement) {
                    try{
                      await document.documentElement.requestFullscreen();
                    } catch (err) {
                      console.warn(err);
                    }
                  }
                  setShowModal(false);
                  setShowWarning(false);

                  showModalRef.current = false;
                }}
                className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
              >
                I Understand
              </Button>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSubmitModal && (
          <Motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]"
          >
            <div className="bg-white rounded-3xl p-8 w-[550px]">

              <h2 className="text-2xl font-bold mb-4">
                Submit Assessment?
              </h2>

              <div className="space-y-2 mb-6">

                <div className="text-green-600 font-bold">
                  Solved Questions: {solvedCount}
                </div>

                <div className="text-red-600 font-bold">
                  Unsolved Questions: {unsolvedCount}
                </div>

                <div className="text-orange-500 font-bold">
                  Marked For Review: {reviewCount}
                </div>

                <div className="font-bold">
                  Time Remaining:
                  {" "}
                  {formatTime(timeLeft)}
                </div>

              </div>

              <div className="flex gap-4 justify-end">

                <Button
                  variant="outline"
                  onClick={() =>
                    setShowSubmitModal(false)
                  }
                >
                  Continue Test
                </Button>

                <Button
                  onClick={handleFinish}
                >
                  Submit Final
                </Button>

              </div>

            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Floating Camera Preview - Top Right */}
      <div className="fixed top-24 right-6 z-[100]">
        <Motion.div 
          className={cn(
            "relative w-[340px] h-[240px] bg-slate-900 rounded-3xl overflow-hidden border-4 shadow-2xl transition-transform hover:-translate-y-1 hover:scale-[1.02]",
            suspiciousCount > 0 ? "border-red-500 shadow-red-500/20" : "border-white/60"
          )}
        >
          {suspiciousCount > 0 && (
            <Motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 z-10 border-4 border-red-500 pointer-events-none rounded-[20px]"
            />
          )}
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-contain scale-x-[-1]"
          />

          <canvas
            ref={canvasRef}
            style={{ display: "none"}}
          /> 

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          
          {/* Premium Header */}

          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"/>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                LIVE MONITORING
              </span>
            </div>
            <div className="px-2 py-1 rounded-full bg-black/40 backdrop-blur text-white text-[10px] font-bold">
              AI ACTIVE
            </div>
          </div>

          {/* Strikes Display */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/45 backdrop-blur-xl rounded-2xl p-3">
              <div className="flex justify-between text-white text-xs">
                <span>Face</span>
                <span className="text-emerald-400 font-bold">
                  Detected
                </span>
              </div>
              <div className="flex justify-between text-white text-xs mt-2">
                <span>Eye Tracking</span>
                <span className="text-emerald-400 font-bold">
                  Active
                </span>
              </div>
              <div className="flex justify-between text-white text-xs mt-2">
                <span>Warnings</span>
                <span className="text-red-400 font-bold">
                  {suspiciousCount}/3
                </span>
              </div>
            </div>
          </div>
        </Motion.div>
        <p className="text-[10px] text-slate-400 mt-2 text-right font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Drag to reposition camera
        </p>

        {lastWarning && (
          <div className="mt-2 bg-red-100 text-red-700 text-xs p-2 rounded-lg">
            {lastWarning}
          </div>
        )}
      </div>

      {/* Persistent Warning Notification */}
      <AnimatePresence>
        {showWarning && (
          <Motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-8 left-1/2 z-[99999] w-full max-w-md"
          >
            <div className="mx-4 bg-red-600 text-white p-4 rounded-2xl shadow-2xl border border-red-500/50 backdrop-blur-md flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-xl">
                <Square className="w-5 h-5 fill-current" />
              </div>
              <div>
                <p className="font-bold text-sm">Security Warning ({suspiciousCount}/3)</p>
                <p className="text-xs opacity-90">{warningMessage}</p>

                {lastWarning && (
                  <p className="text-xs mt-1 font-medium">
                    Last Warning: {lastWarning}
                  </p>
                )}
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-[99999]">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <span className="text-xl font-black">
            V
          </span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-bold">
              Candidate Workspace
            </p>
            <h2 className="text-2xl font-bold text-slate-900 font-outfit">
              {selectedLanguage} Assessment
            </h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-slate-500">
                Question
                <span className="font-bold text-slate-900">
                  {" "}
                  {currentIdx +1}
                </span>
                /
                {questions.length}
              </span>
              <div className="w-20 h-2 rounded-full bg-slate-200 overflow-hidden">
                <Motion.div
                  animate={{
                    width: `${((currentIdx + 1)/questions.length)*100}%`
                  }}

                  className="h-full bg-primary"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Time Remaining</p>
          </div>
          <Button 
            onClick = {() => setShowSubmitModal(true)}
            variant="primary"
            className="px-4 py-2 text-sm"
          >
            Finish Test
          </Button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-200 w-full overflow-hidden">
        <Motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          className="h-full bg-primary"
        />
      </div>


      {/* Main content */}
      <main className="flex-1 overflow-hidden p-4 md:p-10">

        <div className="w-full max-w-6xl mr-[360px] mx-auto">
          <div>
            <AnimatePresence mode="wait">
              {loading ? (
                <Motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <GlassCard className="p-8 md:p-12 text-center">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-slate-200 rounded w-1/4 mx-auto" />
                      <div className="h-8 bg-slate-200 rounded w-3/4 mx-auto" />
                      <div className="h-32 bg-slate-200 rounded w-full" />
                    </div>
                    <p className="mt-8 text-primary font-bold animate-bounce">Generating Personalized Questions...</p>
                  </GlassCard>
                </Motion.div>
              ) : (
                <Motion.div
                  key={currentIdx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                <GlassCard className="p-8 md:p-12">
                  <div className="flex justify-between items-start mb-8">
                    <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      {currentQuestion.type === 'mcq' && <Type className="w-3 h-3" />}
                      {currentQuestion.type === 'text_comprehension' && <FileText className="w-3 h-3" />}
                      {currentQuestion.type === 'listen_repeat' && <Ear className="w-3 h-3" />}
                      {currentQuestion.type === 'fill_blanks' && <Type className="w-3 h-3" />}
                      {currentQuestion.type === 'speaking_topic' && <Mic className="w-3 h-3" />}
                      {currentQuestion.type} Question
                    </span>
                    <button 
                      onClick={toggleBookmark}
                      className={cn(
                        "p-2 rounded-xl transition-colors",
                        bookmarked.has(currentIdx) ? "bg-primary/10 text-primary" : "text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      <Bookmark className="w-6 h-6" fill={bookmarked.has(currentIdx) ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-10 leading-tight font-outfit">
                    {currentQuestion.question}
                  </h2>

                  {/* Question Types Render */}
                  <div className="min-h-[200px]">
                    {currentQuestion.type === 'mcq' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.options.map((opt, i) => (
                          <Motion.div
                            key={i}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAnswer(i)}
                            className={cn(
                              "p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4",
                              answers[currentQuestion.id] === i 
                                ? "border-primary bg-primary/5 ring-4 ring-primary/10" 
                                : "border-slate-100 bg-white hover:border-slate-200"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                              answers[currentQuestion.id] === i ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                            )}>
                              {String.fromCharCode(65 + i)}
                            </div>
                            <span className="text-lg font-medium text-slate-700">{opt}</span>
                          </Motion.div>
                        ))}
                      </div>
                    )}

                    {currentQuestion.type === 'text_comprehension' && (
                      <div className="space-y-6">
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-700 leading-relaxed">
                          {currentQuestion.paragraph}
                        </div>
                        <textarea
                          value={answers[currentQuestion.id] || ''}
                          onChange={(e) => handleAnswer(e.target.value)}
                          placeholder={currentQuestion.placeholder}
                          maxLength={currentQuestion.maxLength}
                          className="w-full p-6 bg-white border-2 border-slate-100 rounded-3xl min-h-[150px] text-lg focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                    )}

                    {currentQuestion.type === 'listen_repeat' && (
                      <div className="flex flex-col items-center justify-center space-y-8 py-4">
                        <div className="text-center mb-4">
                          <p className="text-slate-500 mb-2">Listen to this sentence and repeat it:</p>
                          <h3 className="text-2xl font-bold text-primary font-outfit">{currentQuestion.text}</h3>
                        </div>
                        <div className="flex items-center gap-4">
                          <Button 
                            onClick={async () => {
                              // TTS logic could go here, or just simulate
                              const utterance = new SpeechSynthesisUtterance(currentQuestion.text);
                              utterance.lang = selectedLanguage === 'English' ? 'en-US' : selectedLanguage === 'Spanish' ? 'es-ES' : 'hi-IN';
                              window.speechSynthesis.speak(utterance);
                            }}
                            className="w-16 h-16 rounded-full p-0 flex items-center justify-center"
                            variant="secondary"
                          >
                            <Volume2 className="w-8 h-8" />
                          </Button>
                          <div className="h-12 w-[2px] bg-slate-100 mx-2" />
                          <Button
                            onClick={async () => {
                              if (isRecording) {
                                mediaRecorderRef.current.stop();
                                setIsRecording(false);
                              } else {
                                const stream =
                                  await navigator.mediaDevices.getUserMedia({      
                                    audio: true
                                  });

                                answerRecordingStreamRef.current = stream;
                  
                                mediaRecorderRef.current = new MediaRecorder(stream);
                                audioChunksRef.current = [];
                                mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
                                mediaRecorderRef.current.onstop = async () => {

                                  const audioBlob = new Blob(
                                    audioChunksRef.current,
                                    { type: 'audio/wav' }
                                  );
                                
                                  const result =
                                    await assessmentApi.uploadAudio(
                                      audioBlob,
                                      selectedLanguage
                                    );
                                
                                  handleAnswer(result.transcription);
                                
                                  // Stop microphone completely
                                  answerRecordingStreamRef.current
                                    ?.getTracks()
                                    .forEach(track => track.stop());

                                  answerRecordingStreamRef.current = null;                                
                                };
                                mediaRecorderRef.current.start();
                                setIsRecording(true);
                              }
                            }}
                            variant={isRecording ? 'outline' : 'primary'}
                            className={cn("w-16 h-16 rounded-full p-0 flex items-center justify-center", isRecording && "border-red-500 text-red-500")}
                          >
                            {isRecording ? <Square className="w-6 h-6 fill-current" /> : <Mic className="w-6 h-6" />}
                          </Button>
                        </div>
                        {isRecording && <div className="text-red-500 font-bold animate-pulse">Recording... Speak now</div>}
                      </div>
                    )}

                    {currentQuestion.type === 'fill_blanks' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentQuestion.options.map((opt, i) => (
                            <Motion.div
                              key={i}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleAnswer(i)}
                              className={cn(
                                "p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center gap-4",
                                answers[currentQuestion.id] === i 
                                  ? "border-primary bg-primary/5 ring-4 ring-primary/10" 
                                  : "border-slate-100 bg-white hover:border-slate-200"
                              )}
                            >
                              <span className="text-xl font-bold text-slate-700">{opt}</span>
                            </Motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentQuestion.type === 'speaking_topic' && (
                      <div className="flex flex-col items-center justify-center space-y-8">
                        <div className="text-center p-8 bg-primary/5 rounded-3xl border border-primary/10 w-full max-w-2xl">
                          <p className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Topic</p>
                          <h3 className="text-2xl font-bold text-slate-900 font-outfit">{currentQuestion.topic}</h3>
                        </div>
                        
                        <div className="relative">
                          {isRecording && (
                            <Motion.div 
                              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute -inset-4 bg-red-500/20 rounded-full"
                            />
                          )}
                          <Button
                            onClick={async () => {
                              if (isRecording) {
                                mediaRecorderRef.current.stop();
                                setIsRecording(false);
                              } else {
                                
                                const stream = 
                                  await navigator.mediaDevices.getUserMedia({
                                    audio:true
                                  });

                                  answerRecordingStreamRef.current = stream;

                                  mediaRecorderRef.current = 
                                    new MediaRecorder(stream);

                                audioChunksRef.current = [];
                                mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
                                mediaRecorderRef.current.onstop = async () => {

                                  const audioBlob = new Blob(
                                    audioChunksRef.current,
                                    { type: 'audio/wav' }
                                  );
                                
                                  const result =
                                    await assessmentApi.uploadAudio(
                                      audioBlob,
                                      selectedLanguage
                                    );
                                
                                  handleAnswer(result.transcription);
                                
                                  // Release microphone
                                  answerRecordingStreamRef.current
                                      ?.getTracks()
                                      .forEach(track => track.stop());

                                  answerRecordingStreamRef.current = null;  
                                };
                                mediaRecorderRef.current.start();
                                setIsRecording(true);
                              }
                            }}
                            variant={isRecording ? 'outline' : 'primary'}
                            className={cn(
                              "w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1",
                              isRecording && "border-red-500 text-red-500 hover:bg-red-50"
                            )}
                          >
                            {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-8 h-8" />}
                          </Button>
                        </div>
                        <div className="text-center">
                          <p className={cn("text-xl font-bold", isRecording ? "text-red-500" : "text-slate-400")}>
                            {isRecording ? "Recording in progress..." : "Click to start speaking"}
                          </p>
                          <p className="text-slate-500 text-sm mt-1">Duration: {currentQuestion.duration}s</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Improved Interaction Status */}
                  <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">

                    <h3 className="text-xl font-bold text-slate-900 mb-6">
                      Assessment Progress
                    </h3>

                    <div className="grid grid-cols-2 gap-3 text-sm">

                      <div className="bg-green-50 rounded-2xl p-4">
                        <div className="text-sm text-slate-500">
                          Answered
                        </div>

                        <div className="text-3xl font-bold text-green-600">
                          {solvedCount}
                        </div>
                      </div>

                      <div className="bg-orange-50 rounded-2xl p-4">
                        <div className="text-sm text-slate-500">
                          Review
                        </div>

                        <div className="text-3xl font-bold text-orange-500">
                          {reviewCount}
                        </div>
                      </div>

                      <div className="bg-red-50 rounded-2xl p-4">
                        <div className="text-sm text-slate-500">
                          Remaining
                        </div>

                        <div className="text-3xl font-bold text-red-500">
                          {unsolvedCount}
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-2xl p-4">
                        <div className="text-sm text-slate-500">
                          Time Left
                        </div>

                        <div className="text-2xl font-bold text-blue-600">
                          {formatTime(timeLeft)}
                        </div>
                      </div>

                    </div>

                    <div className="mt-6">

                      <div className="flex justify-between mb-2">

                        <span className="font-medium text-slate-700">
                          Progress
                        </span>

                        <span className="font-bold text-slate-900">
                          {solvedCount}/{questions.length} Questions
                        </span>

                      </div>

                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">

                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-300"
                          style={{
                            width: `${progressPercentage}%`
                          }}
                        />

                      </div>

                    </div>

                  </div>
                </GlassCard>            
              </Motion.div>
            )}
            </AnimatePresence>
        </div>
        {/* Question Navigator */}
        <div className="
          fixed 
          right-6 
          top-[360px] 
          w-[320px] 
          min-h-[500px]
          bg-white 
          rounded-3xl 
          shadow-xl border border-slate-100 
          p-5 
          z-50">

          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              Assessment Progress
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Track your progress  throughout the assessment
            </p>
          </div>

          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">
                Progress
              </span>
              <span className="text-sm font-bold text-slate-900">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <Motion.div
                animate={{
                  width: `${progressPercentage}%`
                }}
                className="h-full bg-green-500 rounded-full"
              />
            </div>
          </div>  

            <div className="grid grid-cols-3 gap-3 mt-6 mb-6">
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {solvedCount}
                </div>
                <div className="text-xs text-slate-500">
                  Answered
                </div>
              </div>

              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {reviewCount}
                </div>
                <div className="text-xs text-slate-500">
                  Review
                </div>
              </div>

              <div className="bg-red-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-red-500">
                  {unsolvedCount}
                </div>
                <div className="text-xs text-slate-500">
                  Remaining
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 my-6"/>

            <h4 className="text-sm font-bold text-slate-700 mt-6 mb-3 uppercase tracking-wide">
            Question Navigator
          </h4>


          <div className="
            grid 
            pt-2
            grid-cols-[repeat(auto-fit,minmax(55px,1fr))] gap-3 
            max-h-[50vh] 
            overflow-y-auto
            "
          >

            {questions.map((q, idx) => (

              <button 
                key={q.id} 
                onClick={() => setCurrentIdx(idx)}
                className={`h-12
                  w-12
                  rounded-2xl
                  text-lg 
                  font-bold
                  transition-all

                  ${
                    currentIdx === idx
                    ? "border-4 border-blue-500 bg-white !text-blue-600"
                    : ""
                  }

                  ${
                    markedForReview[q.id]
                    ? "bg-yellow-400 text-white"
                    : answers[q.id] !== undefined
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                  }
                `}
                >
                  {idx + 1}
                </button>

            ))}
          </div>
            <div className="border-t border-slate-200 mt-8 pt-6">

              <div className="grid grid-cols-2 gap-3 text-sm">

                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-md"></div>
                  <span>Answered</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded-md"></div>
                  <span>Review</span>
                </div>            

                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-md"></div>
                  <span>Unanswered</span>
                </div>

                <div className="  flex items-center  gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 rounded-md"></div>
                  <span>Current</span>
                </div>
              </div>
              </div>
        </div>

      </div>        
    </main>

        <AnimatePresence>
          {isSubmitting && (
            <Motion.div
              initial={{ opacity: 0}}
              animate={{ opacity: 1}}
              exit={{ opacity: 0}}
              className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[999999] flex items-center justify-center"
            >
              <div className="bg-white rounded-3xl p-10 text-center shadow-2xl w-[420px]">
                <div className="animate-spin h-14 w-14 border-4 border-primary border-t-transparent rounded-full mx-auto mb-6"/>
                <h2 className="text-2xl font-bold text-slate-900">
                  Submitting Assessment...
                </h2>
                <p className="text-slate-500 mt-3">
                  Uploading your result and closing your session...
                </p>
                <p className="text-xs text-slate-400 mt-4">
                  Please don't close this window.
                </p>
              </div>
            </Motion.div>
          )}  
        </AnimatePresence>

      {/* Footer Controls */}  
      <footer className="bg-white border-t border-slate-200 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(currentIdx - 1)}
            className="text-slate-500 font-bold"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Previous
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              setMarkedForReview(prev => ({
                ...prev,
                [currentQuestion.id]:
                  !prev[currentQuestion.id]
              }))
            }
          >
            {markedForReview[currentQuestion.id]
              ? "Marked For Review"
              : "Mark For Review"}
          </Button>

          <Button
            variant="primary"
            onClick={() => currentIdx === questions.length - 1 ? setShowSubmitModal(true) : setCurrentIdx(currentIdx + 1)}
            className="min-w-[140px]"
          >
            {currentIdx === questions.length - 1 ? (
              <>Submit Final <Send className="w-4 h-4 ml-2" /></>
            ) : (
              <>Next Question <ChevronRight className="w-5 h-5 ml-1" /></>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Assessment;


