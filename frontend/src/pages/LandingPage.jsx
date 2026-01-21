import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import SkillShowcase from "../components/SkillShowcase";
import { ArrowRight, Star, Globe, Shield, Zap, Users, BookOpen } from "lucide-react";

export default function LandingPage() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={container}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-6xl md:text-8xl font-heading font-extrabold text-gray-900 tracking-tight mb-8 leading-[1.1]"
            >
              Master New Skills, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Share Your Passion
              </span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Connect with expert mentors, book 1-on-1 sessions, and accelerate your learning journey.
              Trade your expertise for new knowledge in a thriving community.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-full font-bold text-lg shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-600 border-2 border-indigo-100 rounded-full font-bold text-lg hover:border-indigo-200 hover:bg-indigo-50 transition-all"
              >
                Log In
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>
      </section>

      {/* Skill Showcase Feed */}
      < SkillShowcase />

      {/* Features Section */}
      < section className="py-20 bg-white/50 backdrop-blur-sm relative z-10 border-y border-gray-100" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose SkillSwap?</h2>
            <p className="text-lg text-gray-600">Everything you need to grow your skills and network.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon="🎓"
              title="Expert Mentors"
              description="Find verified mentors rated by the community. Learn from the best in their field."
              delay={0}
            />
            <FeatureCard
              icon="📅"
              title="Easy Scheduling"
              description="Book sessions that fit your calendar. Seamless coordination with built-in tools."
              delay={0.2}
            />
            <FeatureCard
              icon="💎"
              title="Credit System"
              description="Earn credits by teaching what you know. Use them to learn something new."
              delay={0.4}
            />
          </div>
        </div>
      </section >

      {/* How It Works */}
      < section className="py-20 bg-indigo-900 text-white relative overflow-hidden" >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-indigo-200 text-lg">Start your journey in three simple steps.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <Step
              number="1"
              title="Create Profile"
              description="Sign up and list the skills you can teach and what you want to learn."
            />
            <Step
              number="2"
              title="Find a Mentor"
              description="Browse our marketplace to find the perfect mentor for your goals."
            />
            <Step
              number="3"
              title="Start Learning"
              description="Book a session, connect via chat, and level up your skills."
            />
          </div>
        </div>
      </section >

      {/* CTA Section */}
      < section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center" >
        <div className="max-w-4xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold mb-8"
          >
            Ready to Transform Your Career?
          </motion.h2>
          <Link
            to="/signup"
            className="inline-block px-10 py-4 bg-white text-indigo-600 rounded-full font-bold text-xl shadow-lg hover:bg-gray-100 transition-colors"
          >
            Join SkillSwap Today
          </Link>
        </div>
      </section >
    </div >
  );
}

function FeatureCard({ icon, title, description, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function Step({ number, title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative"
    >
      <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg border-4 border-indigo-400">
        {number}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-indigo-200">{description}</p>
    </motion.div>
  );
}
