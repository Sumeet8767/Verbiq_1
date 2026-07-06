import React, { useMemo } from 'react';
import {motion as Motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Award, Clock, FileCheck2, Share2, ArrowRight, Square } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { cn } from '../utils/cn';

const Completion = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { answers = {}, timeTaken = 0, terminated = false, reason = "" } = location.state || {};
  
  const totalQuestions = 25;
  const attempted = Object.keys(answers).length;

  const confettiParticles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: i % 2 === 0 ? -500 : 500,
        duration: 5,
        color: ['bg-primary', 'bg-secondary', 'bg-yellow-400', 'bg-blue-400'][i % 4],
      })),
    []
  );

  const successVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 20 } }
  };

  return (
    <div className="min-h-screen bg-background-soft flex items-center justify-center p-6">
      {/* Confetti particles Simulation */}
      <div className="fixed inset-0 pointer-events-none">
        {confettiParticles.map((particle, i) => (
          <Motion.div
            key={particle.id}
            initial={{ opacity: 0, y: 100 }}
            animate={{ 
              opacity: [0, 1, 0],
              y: -500,
              x: particle.x,
              rotate: 360
            }}
            transition={{ duration: particle.duration, repeat: Infinity, delay: i * 0.2 }}
            className={`absolute bottom-0 left-1/2 w-4 h-4 rounded-full ${particle.color}`}
          />
        ))}
      </div>

      <div className="w-full max-w-3xl relative z-10">
        <GlassCard className="text-center py-16 px-10">
          <Motion.div
            variants={successVariants}
            initial="initial"
            animate="animate"
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10 border-4 border-double shadow-xl",
              terminated 
                ? "bg-red-100 border-red-50 shadow-red-100/50" 
                : "bg-green-100 border-green-50 shadow-green-100/50"
            )}
          >
            {terminated ? (
              <Square className="w-12 h-12 text-red-600 fill-current" />
            ) : (
              <CheckCircle2 className="w-14 h-14 text-green-600" />
            )}
          </Motion.div>

          <Motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-extrabold text-slate-900 mb-4 font-outfit"
          >
            {terminated ? "Test Terminated" : "Assessment Completed"}
          </Motion.h1>
          
          <Motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-slate-500 mb-12 max-w-xl mx-auto"
          >
            {terminated 
              ? reason || "Your assessment was terminated due to a security violation detected by our proctoring system."
              : "Great job! You have successfully completed all the assessment modules. Your results are being processed."}
          </Motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { label: 'Attempted', value: `${attempted}/${totalQuestions}`, icon: FileCheck2 },
              { label: 'Time Taken', value: `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`, icon: Clock },
              { 
                label: 'Status', 
                value: terminated ? 'Flagged' : 'Submitted', 
                color: terminated ? 'text-red-600' : 'text-green-600', 
                icon: terminated ? Square : Award 
              },
            ].map((stat, i) => (
              <Motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="bg-white/50 border border-slate-100 p-6 rounded-3xl"
              >
                <stat.icon className="w-6 h-6 text-slate-400 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color || 'text-slate-800'}`}>{stat.value}</p>
              </Motion.div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Button 
               variant="outline" 
               className="px-8 border-slate-200 text-slate-600 hover:bg-slate-50"
               onClick={() => window.print()}
             >
               Download Summary <Share2 className="w-4 h-4 ml-2" />
             </Button>
             <Button 
               className="px-10 py-4 text-lg"
               onClick={() => navigate('/login')}
             >
               Finish & Exit <ArrowRight className="w-5 h-5 ml-2" />
             </Button>
          </div>
        </GlassCard>

        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-12"
        >
          <p className="text-slate-400 text-sm italic font-medium">
            "Your responses are being evaluated. Results will be shared with the recruiter shortly."
          </p>
        </Motion.div>
      </div>
    </div>
  );
};

export default Completion;
