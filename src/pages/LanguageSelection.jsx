import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Globe2, ChevronRight } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';

const languages = [
  { id: 'en', name: 'English', icon: '🇺🇸', description: 'Global Business Standard' },
  { id: 'hi', name: 'Hindi', icon: '🇮🇳', description: 'Vernacular Excellence' },
  { id: 'es', name: 'Spanish', icon: '🇪🇸', description: 'Latin American Reach' },
];

const LanguageSelection = () => {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const handleContinue = (langId) => {
    setSelected(langId);
    
    navigate("/instructions",{
      state: {
        lang: langId
      }
    });
  };

  return (
    <div className="min-h-screen bg-background-soft p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl">
        <header className="text-center mb-12">
          <Motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex p-3 bg-primary/10 rounded-2xl mb-4"
          >
            <Globe2 className="w-8 h-8 text-primary" />
          </Motion.div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2 font-outfit">
            Choose Your Assessment Language
          </h1>
          <p className="text-slate-500 text-lg">
            Select the language you wish to be evaluated in today.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {languages.map((lang, index) => (
            <Motion.div
              key={lang.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={selected ? {} : { y: -8 }}
              onClick={() => !selected && handleContinue(lang.id)}
              className={`
                group
                relative
                ${selected ? "pointer-events-none" : "cursor-pointer"}
                `}
            >
              <GlassCard className={`h-full border-2 transition-all duration-300 ${
                selected === lang.id ? 'border-primary ring-4 ring-primary/10' : 'border-white hover:border-slate-200'
              }`}>
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {lang.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2 font-outfit">
                  {lang.name}
                </h3>
                <p className="text-slate-500 mb-6">
                  {lang.description}
                </p>
                <div className="flex items-center text-primary font-bold group-hover:translate-x-2 transition-transform">
                  <span>Start Now</span>
                  <ChevronRight className="w-5 h-5 ml-1" />
                </div>
              </GlassCard>
              
              {selected === lang.id && (
                <Motion.div
                  layoutId="active-highlight"
                  className="absolute -inset-1 bg-primary/5 rounded-[32px] -z-10"
                />
              )}
            </Motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSelection;
