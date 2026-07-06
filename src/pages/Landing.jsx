import React from 'react';
import { motion as Motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Zap, 
  Globe, 
  BarChart3, 
  Users, 
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Play,
  Camera
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';

const Landing = () => {
  const navigate = useNavigate();

/*  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
*/
  return (
    <div className="min-h-screen bg-background-soft text-slate-900 overflow-x-hidden">
      {/* =============== PREMIUM NAVBAR =============== */}
      <Motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="
          fixed
          top-0
          left-0
          right-0
          z-50
          backdrop-blur-2xl
          bg-white/85
          border-b
          border-white/30
          shadow-[0_8px_30px_rgba(15, 23, 42, 0.06)]
          "
        >
          <div className="max-w-7xl mx-auto px-8">
            <div className="h-20 flex items-center justify-between">

              {/* Logo */}
              <Motion.div
                whileHover={{
                  scale: 1.05
                }}
                className="flex items-center gap-4 cursor-pointer"
              >
                <div
                  className="
                  relative
                  h-12
                  w-12
                  rounded-2xl
                  bg-gradient-to-br
                  from-red-600
                  via-red-500
                  to-red-700
                  flex
                  items-center
                  justify-center
                  shadow-xl
                  shadow-red-600/30
                  "
                >
                  <Shield className="text-white w-6 h-6"/>
                  <div
                    className="
                    absolute
                    -inset-1
                    rounded-2xl
                    bg-red-500/20
                    blur-xl
                    -z-10
                    "
                    />
                    </div>
                    <div>
                    <h1 className="font-outfit text-3xl font-bold tracking-tight">                      
                      Verbi
                      <span className="text-primary">
                        q
                      </span>
                    </h1>
                    <p className="text-xs text-slate-500 tracking-[0.25em] uppercase">
                      AI PROCTORING
                    </p>
                </div>
              </Motion.div>

      {/* Desktop Menu */}

      <div className="hidden lg:flex items-center gap-10">
        {[
          "Features",
          "Security",
          "Solution",
          "Pricing",
          "About"
        ].map((item) => (

          <Motion.a
            key={item}
            whileHover={{
              y:-2
            }}
            href="#"
            className="
            relative
            font-semibold
            text-slate-600
            hover:text-primary
            transition
            "
          >
            {item}
          </Motion.a>
        ))}
      </div>

      {/*Right Buttons */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost"
          onClick={() => navigate(("/login"))}
          >
            Log In
          </Button>

          <Button
            onClick={() => {
              const token = localStorage.getItem("token");

              if (token) {
                navigate("/dashboard");
              } else {
                navigate("/login");
              }
            }}
            className="px-8"
            >
              Start Assessment
              <ArrowRight className="w-5 h-5" />
            </Button>
      </div>
    </div>
  </div>
</Motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center px-6 pt-24">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[10%] right-[-5%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] left-[-5%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px]" />

          <Motion.div
            animate={{ rotate:360 }}
            transition={{
              repeat:Infinity,
              duration:80,
              ease:"linear"
            }}
            className="
            absolute
            top-1/2
            left-1/2
            -translate-x-1/2
            -translate-y-1/2
            w-[900px]
            h-[900px]
            rounded-full
            border
            border-primary/5
            "
          />

          <Motion.div
            animate={{ rotate:-360 }}
            transition={{
              repeat:Infinity,
              duration:120,
              ease:"linear"
            }}
            className="
            absolute
            top-1/2
            left-1/2
            -translate-x-1/2
            -translate-y-1/2
            w-[700px]            
            h-[700px]            
            rounded-full
            border
            border-secondary/5
            "
          />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.3fr_1fr] gap-16 items-center">
          
          {/* LEFT COLUMN */}

          <div>
          <Motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-8"
          >
            <Zap className="w-4 h-4" />
            <span>AI-Powered Language Intelligence</span>
          </Motion.div>

          <Motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold font-outfit text-slate-900 mb-6 leading-tight"
          >
            Recruit Smarter.<br />
            <span className="shimmer-text">Powered by AI.</span>
          </Motion.h1>

          <Motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-500 max-w-2xl mb-10 leading-relaxed"
          >
          Verbiq helps organizations conduct secure AI-powered assessments using real-time proctoring, multilingual evaluation and intelligent candidate analytics.
          </Motion.p>

          <Motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-start gap-4"
          >
            <Button 
              className="px-8 py-4 text-lg bg-primary hover:bg-primary-dark shadow-xl shadow-primary/20 group"
              onClick={() => navigate('/login')}
            >
              Start Assessment
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              className="px-8 py-4 text-lg border-2"
            >
              Watch Demo Video
              <Play className="w-4 h-4 ml-2 fill-current" />
            </Button>
          </Motion.div>

          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10"
          >

            <p className="text-sm text-slate-500 mb-4">
              Built for Modern Hiring Teams
            </p>

            <div className="flex flex-wrap gap-3">

              {[
                "AI Powered",
                "Secure",
                "Enterprise Ready"
              ].map(tag => (

                <Motion.div
                  key={tag}
                  whileHover={{ scale:1.08 }}
                  className="
                  px-4
                  py-2
                  rounded-full
                  bg-primary/10
                  text-primary
                  text-sm
                  font-semibold
                  "
                >
                  {tag}
                </Motion.div>

              ))}

            </div>

          </Motion.div>
          </div>

          {/* RIGHT COLUMN */}  

          <Motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-20 w-full max-w-5xl mx-auto"
          >

            <div className="relative">

              <Motion.div
                animate={{
                  y:[0,-10,0]
                }}
                transition={{
                  repeat:Infinity,
                  duration:3
                }}
                className="
                absolute
                -top-4
                -left-6
                bg-white
                rounded-2xl
                shadow-xl
                px-5
                py-4
                z-20
                "
              >
                <p className="text-xs text-slate-500">
                  Assessments
                </p>

                <h2 className="text-3xl font-bold text-primary">
                  1M+
                </h2>
              </Motion.div>

              <Motion.div
                animate={{
                  y:[0,10,0]
                }}
                transition={{
                  repeat:Infinity,
                  duration:4
                }}
                className="
                absolute
                -bottom-4
                -right-6
                bg-white
                rounded-2xl
                shadow-xl
                px-5
                py-4
                z-20
                "
              >
                <p className="text-xs text-slate-500">
                  Accuracy
                </p>
                <h2 className="text-3xl font-bold text-green-600">
                  99.8%
                </h2>
              </Motion.div>

            <GlassCard className="p-8 lg:p-10 shadow-[0_25px_80px_rgba(15,23,42,0.12)]">
              <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-start">

                {/* LEFT */}
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-3xl font-bold leading-tight">
                        AI Assessment                               
                      </h3>

                      <div className="flex items-center gap-2">
                      
                        <Motion.div
                          animate={{
                            scale: [1, 1.4, 1],
                            opacity: [1, .5, 1]
                          }}
                          transition={{
                            repeat:Infinity,
                            duration: 1.5
                          }}
                          className="w-3 h-3 rounded-full bg-green-500"
                        />

                        <span className="text-green-600 font-semibold">

                          LIVE
                          
                        </span>

                      </div>                                              
                      <p className="text-base text-slate-500 mt-4 leading-8 max-w-[280px]">
                        Real-time candidate monitoring 
                        powered by Verbiq AI.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                  {[
                    ["Face Detection","98%","bg-green-500"],
                    ["Eye Tracking","96%","bg-blue-500"],
                    ["Speech Analysis","99%","bg-purple-500"],
                    ["Phone Detection","100%","bg-red-500"],
                    ["Multiple Person","100%","bg-emerald-500"]
                  ].map(([title,value,colorClass]) => (

                      <Motion.div
                        key={title}
                        whileHover={{
                          x:5
                        }}
                        className="
                        rounded-xl
                        bg-white
                        px-5
                        py-3
                        shadow-lg 
                        hover:shadow-xl 
                        transition-all 
                        duration-300
                        flex
                        justify-between
                        items-center
                        "
                      >
                        <span className="font-semibold">
                          {title}
                        </span>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${colorClass}`}
                          />
                          <span className="font-bold">
                            {value}
                          </span>
                        </div>
                      </Motion.div>
                    ))}
                  </div>
                </div>

                {/* RIGHT */}
                <div>
                  <div
                    className="
                    rounded-3xl
                    bg-geadient-t-br
                    from-slate-900
                    via-slate-900
                    to-slate-800
                    p-6
                    text-white
                    max-h-[720px]
                    "
                  >
                    <div className="flex justify-between mb-6">
                      <div>
                        <h3 className="text-2xl fint-bold leading-tight text-shadow-red-400">
                          AI Candidate
                          <br />
                          Monitor
                        </h3>
                        <p className="text-slate-400">
                          AI Monitoring
                        </p>
                      </div>
                      <Shield className="text-green-400"/>
                    </div>
                    <div className="relative rounded-2xl bg-slate-800 h-48 overflow-hidden mb-5">

  {/* Candidate */}

  <div className="absolute inset-0 flex items-center justify-center">

      <div className="w-28 h-28 rounded-full bg-slate-700 flex items-center justify-center">

          <Camera className="w-14 h-14 text-slate-300"/>

      </div>

        </div>

        {/* AI Scan */}

        <Motion.div

            animate={{
                y:[0,240,0]
            }}

            transition={{
                duration:2,
                repeat:Infinity,
                ease:"linear"
            }}

            className="
            absolute
            left-0
            right-0

            h-1

            bg-gradient-to-r
            from-transparent
            via-green-400
            to-transparent

            shadow-lg
            shadow-green-400/70
            "

        />

        {/* Corner */}

        <div className="absolute top-4 left-4">

            <span className="px-3 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold tracking-wide">

                ● LIVE

            </span>

        </div>

      </div>

      {/* Monitoring Status */}

      <div className="space-y-3 mt-5">

        {[
          "Face Detection",
          "Eye Tracking",
          "Voice Analysis",
          "Screen Monitoring",
          "Phone Detection"
        ].map((item) => (

          <div 
            key={item}
            className="flex justify-between items-center rounded-xl bg-slate-800 px-4 py-2"
          >

            <span className="text-sm text-slate-300">
              {item}
              </span> 

            <span className="text-sm font-semibold text-green-400">
              Active
            </span>
          </div>
        ))}
      </div>
                    <div className="grid grid-cols-[2fr_1fr] gap-3 mt-5">
                      <div className="rounded-xl bg-slate-800 p-4">
                        <p className="text-slate-400 text-sm">
                          AI Confidence
                        </p>
                        <Motion.h2
                          animate={{
                            scale: [1, 1.08, 1],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 2,
                          }}
                          className="text-4xl font-black text-green-400"
                          >
                            98%
                          </Motion.h2>
                      </div>
                      <div className="rounded-xl bg-slate-800 p-4">
                        <p className="text-slate-400 text-sm">
                          Violations
                        </p>

                        <h2 className="text-3xl font-bold text-green-400">
                          0
                        </h2>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
            </div>
          </Motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-white/30 to-white/70">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Assessments Conducted', value: '1M+' },
            { label: 'Languages Supported', value: '45+' },
            { label: 'Accuracy Rate', value: '99.8%' },
            { label: 'Client Satisfaction', value: '4.9/5' },
          ].map((stat, i) => (
            <Motion.div 
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-primary font-outfit mb-2">{stat.value}</div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</div>
            </Motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold font-outfit mb-4">Why Leading Companies Choose Verbiq</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Our triple-layered security and linguistic AI provide the gold standard 
              for modern proficiency evaluation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'Secure Proctoring',
                desc: 'Multi-modal AI surveillance detects face-swapping, secondary devices, and unauthorized assistance.'
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: 'Instant Scoring',
                desc: 'Our NLP engines provide objective scoring across grammar, fluency, and semantic coherence.'
              },
              {
                icon: <Globe className="w-8 h-8" />,
                title: 'Native-Level Analysis',
                desc: 'Support for diverse accents and regional dialects with high-resolution phonetic analysis.'
              }
            ].map((feature, i) => (
              <Motion.div
                key={i}
                whileHover={{ 
                  y: -10,
                  scale:1.02
                }}
                className="group"
              >
                <GlassCard className="h-full border-b-4 border-transparent group-hover:border-primary transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 font-outfit">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                </GlassCard>
              </Motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <Motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto rounded-[40px] bg-secondary-dark p-12 md:p-20 text-center relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px]" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white font-outfit mb-8">
              Ready to verify global talent?
            </h2>
            <p className="text-white/70 text-lg mb-12 max-w-2xl mx-auto">
              Join 500+ enterprises that trust Verbiq for their hiring assessments.
              Start your first session today.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Button 
                onClick={() => navigate('/login')}
                className="px-10 py-3 text-xl bg-white text-secondary-dark hover:bg-slate-100 shadow-xl border-none"
              >
                Get Started Now
              </Button>
              <Button 
                variant="outline"
                className="px-10 py-3 text-xl text-white border-white/30 hover:bg-white/10"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </Motion.div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md">
              <Shield className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold font-outfit">Verbiq</span>
          </div>
          <div className="flex gap-8 text-sm text-slate-500">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Security</a>
            <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
          </div>
          <p className="text-sm text-slate-400">© 2024 Verbiq AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
