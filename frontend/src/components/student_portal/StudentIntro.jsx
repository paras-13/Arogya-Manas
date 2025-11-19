import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Heart,
  BookOpen,
  Smile,
  ArrowRight,
  Users,
  ShieldCheck,
  MessageSquare,
  Star,
  HandHeart,
  Lightbulb,
  Wand2,
} from "lucide-react";

const StudentIntro = () => {
  const navigate = useNavigate();
  const goToDashboard = () => navigate("/arogyamanas/student/dashboard");

  return (
    <div className="relative min-h-screen bg-linear-to-br from-indigo-200 via-white to-blue-200 overflow-hidden">
      {/* Decorative floating auroras */}
      <div className="absolute -top-16 -left-20 h-72 w-72 bg-indigo-400/40 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-40 right-0 h-56 w-56 bg-purple-300/40 rounded-full blur-2xl animate-bounce"></div>
      <div className="absolute bottom-0 left-1/3 h-64 w-64 bg-blue-300/40 rounded-full blur-3xl animate-pulse"></div>

      {/* Content Container */}
      <div className="relative max-w-6xl mx-auto px-6 py-16 space-y-20">
        {/* HERO SECTION */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent flex justify-center gap-3">
            <Sparkles className="h-8 w-8 animate-spin-slow text-indigo-500" />
            Welcome to ArogyaManas – Your Wellness Companion ✨
          </h1>
          <p className="max-w-2xl mx-auto text-gray-600 text-sm md:text-base leading-relaxed">
            College life can feel overwhelming — juggling academics, social
            pressures, expectations, and personal emotions. ArogyaMitra is built
            to give you warmth, support, and clarity.
            <span className="font-semibold text-indigo-700">
              {" "}
              You deserve to feel understood. 💙
            </span>
          </p>
        </div>

        {/* BENEFITS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <FeatureCard
            icon={<Smile className="h-7 w-7 text-indigo-700" />}
            title="Emotional Check-ins"
            desc="Reflect on your day, understand your feelings, and notice your emotional patterns."
            color="indigo"
          />

          {/* Card 2 */}
          <FeatureCard
            icon={<BookOpen className="h-7 w-7 text-blue-700" />}
            title="Wellness Resource Hub"
            desc="Explore powerful yet simple exercises, self-help tips, and student-friendly guides."
            color="blue"
          />

          {/* Card 3 */}
          <FeatureCard
            icon={<Heart className="h-7 w-7 text-emerald-700" />}
            title="Talk to Counselors"
            desc="Connect with trained counselors from your institution and get gentle guidance."
            color="emerald"
          />
        </div>

        {/* WHY SECTION */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-10 md:p-14 shadow-lg space-y-10">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-indigo-800">
            Why ArogyaManas Exists?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <WhyItem
              icon={<Users className="h-8 w-8 text-purple-600" />}
              title="You’re Not Alone"
              desc="Every student goes through stress, confusion, and emotional lows. It’s normal, and it’s okay."
            />

            <WhyItem
              icon={<ShieldCheck className="h-8 w-8 text-indigo-600" />}
              title="Safe & Private"
              desc="Your conversations stay between you and your counselor. Your privacy is our priority."
            />

            <WhyItem
              icon={<Lightbulb className="h-8 w-8 text-yellow-600" />}
              title="Clarity & Support"
              desc="Making sense of your feelings becomes easier when someone gently walks with you."
            />
          </div>
        </div>

        {/* AI + COUNSELING SUPPORT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h3 className="text-2xl md:text-3xl font-semibold text-indigo-800">
              Your personal wellness circle — all in one place 💫
            </h3>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              From AI-powered supportive chat to real counselor sessions,
              ArogyaMitra gives you a comforting environment to express freely.
              No judgment. No pressure. Just care.
            </p>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex gap-2">
                <HandHeart className="h-5 w-5 text-rose-500" /> AI Emotional
                Support
              </li>
              <li className="flex gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-500" /> 1-on-1
                Counselor Chat
              </li>
              <li className="flex gap-2">
                <Star className="h-5 w-5 text-yellow-500" /> Personalized
                Guidance
              </li>
            </ul>
          </div>

          <div className="bg-white/50 backdrop-blur-xl shadow-xl rounded-2xl p-8 border border-white/40">
            <p className="text-indigo-700 font-semibold text-lg mb-3">
              “Your feelings matter. Your thoughts matter. And you matter.”
            </p>
            <p className="text-gray-600 text-sm">
              ArogyaManas is built so that no student ever has to face tough
              days alone. We’re here to listen. Support. And guide you gently.
            </p>
          </div>
        </div>

        {/* CTA SECTION */}
        <div className="text-center space-y-4">
          <button
            onClick={goToDashboard}
            className="px-10 py-3.5 rounded-full bg-linear-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition flex items-center gap-2 mx-auto"
          >
            <Wand2 className="h-5 w-5" />
            Open Student Dashboard
            <ArrowRight className="h-5 w-5" />
          </button>

          <p className="text-xs text-gray-600">
            Your thoughts are valid. Your feelings are real. We’re with you
            every step of the way. 💙
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentIntro;

/* ---------- Sub Components ---------- */

const FeatureCard = ({ icon, title, desc }) => (
  <div className="group bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-xl hover:scale-105 transition duration-300">
    <div className="flex items-center gap-3 mb-3">
      {icon}
      <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
    </div>
    <p className="text-gray-600 text-sm">{desc}</p>
  </div>
);

const WhyItem = ({ icon, title, desc }) => (
  <div className="bg-white/60 rounded-2xl p-6 shadow-sm hover:shadow-lg transition border border-gray-100">
    <div className="mb-3">{icon}</div>
    <h4 className="font-semibold text-gray-800 text-lg mb-1">{title}</h4>
    <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
  </div>
);
