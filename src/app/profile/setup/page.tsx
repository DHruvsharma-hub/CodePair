"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Code2, 
  Settings, 
  Sparkles, 
  Terminal, 
  User, 
  BookOpen, 
  Gauge, 
  HelpCircle, 
  Loader2,
  Check,
  AlertCircle
} from "lucide-react";

const AVAILABLE_LANGUAGES = ["C++", "Python", "Java", "JavaScript", "TypeScript"];
const AVAILABLE_TOPICS = ["Arrays", "Strings", "Hash Tables", "Trees", "Graphs", "Dynamic Programming", "Recursion", "Sorting & Searching"];
const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const ROLE_PREFERENCES = [
  { value: "helpee", label: "I need help (Learn from others)", desc: "Best if you are stuck or want to debug a problem with a mentor." },
  { value: "helper", label: "I can help (Mentor others)", desc: "Best if you want to teach, practice code review, and share your logic." },
  { value: "both", label: "Both (Any role is fine)", desc: "Best for standard collaborative pair-programming peer sessions." }
];

export default function ProfileSetupPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState("Intermediate");
  const [rolePreference, setRolePreference] = useState("both");
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.username) setUsername(data.username);
        else if (session?.user?.name) {
          // Fallback to name or clean email prefix
          const defaultUser = session.user.name.toLowerCase().replace(/\s+/g, "_");
          setUsername(defaultUser);
        }
        
        if (data.preferences) {
          setSelectedLanguages(data.preferences.languages || []);
          setSelectedTopics(data.preferences.topics || []);
          setSkillLevel(data.preferences.skillLevel || "Intermediate");
          setRolePreference(data.preferences.rolePreference || "both");
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile settings", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!username.trim()) {
      setError("Please choose a valid username.");
      setSubmitting(false);
      return;
    }

    if (selectedLanguages.length === 0) {
      setError("Please select at least one preferred programming language.");
      setSubmitting(false);
      return;
    }

    if (selectedTopics.length === 0) {
      setError("Please select at least one DSA topic of interest.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          languages: selectedLanguages,
          topics: selectedTopics,
          skillLevel,
          rolePreference,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile settings.");
      }

      // Update nextauth session state cache
      await update({
        username,
        name: username,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
        <span className="text-sm text-slate-400 font-medium">Fetching profile details...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center py-16 px-4 relative">
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-slate-900/40 border border-slate-900 backdrop-blur-md rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Progress header */}
        <div className="flex items-center space-x-3 mb-8 pb-6 border-b border-slate-800/60">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Complete Profile</h2>
            <p className="text-xs text-slate-400 mt-0.5">Customize matchmaking criteria. Starting ELO: 1000.</p>
          </div>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 animate-bounce">
              <Check className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Preferences Saved!</h3>
            <p className="text-sm text-slate-400">Redirecting to match dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-300 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                <User className="h-4 w-4 text-indigo-400" />
                <span>Choose Handle / Username</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="developer_name"
                className="w-full max-w-md px-4 h-11 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-medium"
              />
            </div>

            {/* Languages Multi-Select */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                <Code2 className="h-4 w-4 text-indigo-400" />
                <span>Preferred Languages (Select one or more)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_LANGUAGES.map(lang => {
                  const isSelected = selectedLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected 
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10" 
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topics Multi-Select */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-indigo-400" />
                <span>DSA Topics of Interest (Select one or more)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TOPICS.map(topic => {
                  const isSelected = selectedTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected 
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10" 
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skill Level Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                <Gauge className="h-4 w-4 text-indigo-400" />
                <span>Your Skill Level</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {SKILL_LEVELS.map(level => {
                  const isSelected = skillLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSkillLevel(level)}
                      className={`py-3 rounded-xl text-xs font-bold border transition-all text-center ${
                        isSelected 
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10" 
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Matching Role Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                <HelpCircle className="h-4 w-4 text-indigo-400" />
                <span>Matching Role Preference</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ROLE_PREFERENCES.map(role => {
                  const isSelected = rolePreference === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setRolePreference(role.value)}
                      className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between h-32 ${
                        isSelected 
                          ? "bg-indigo-600/10 border-indigo-500 text-white" 
                          : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-300"
                      }`}
                    >
                      <span className={`text-xs font-bold ${isSelected ? "text-indigo-400" : "text-slate-300"}`}>{role.label}</span>
                      <span className="text-[10px] leading-relaxed text-slate-500 mt-2">{role.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-slate-800/60 flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center px-6 h-11 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl transition duration-200 shadow-lg shadow-indigo-600/10 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Save Preferences</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
