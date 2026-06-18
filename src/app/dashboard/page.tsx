import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  Code2, 
  User, 
  Flame, 
  Trophy, 
  Sparkles, 
  LogOut, 
  Search, 
  Play, 
  ChevronRight,
  BookOpen,
  Settings
} from "lucide-react";
import LogoutButton from "@/components/logout-button";
import DashboardMatching from "@/components/dashboard-matching";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { preferences: true }
  });

  if (!user?.preferences) {
    // If onboarding is not completed, force setup
    redirect("/profile/setup");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
              DSA Debug Room
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-500 block animate-pulse" />
              <span>Matching Server Online</span>
            </div>
            <Link
              href="/profile/setup"
              className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 rounded-xl transition text-slate-400 hover:text-white"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Profile Stats Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/30 border border-slate-900 backdrop-blur-md rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            
            {/* User header */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-14 w-14 rounded-2xl bg-indigo-950 border border-indigo-500/30 flex items-center justify-center">
                <User className="h-7 w-7 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">@{user.username || "coder"}</h3>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6 border-y border-slate-800/60 py-4">
              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Trophy className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ELO Rating</div>
                  <div className="text-sm font-bold text-white">{user.eloRating}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Flame className="h-4 w-4 text-orange-400 animate-pulse" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Daily Streak</div>
                  <div className="text-sm font-bold text-white">{user.streak} days</div>
                </div>
              </div>
            </div>

            {/* Preferences Details */}
            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Languages</h4>
                <div className="flex flex-wrap gap-1.5">
                  {user.preferences?.languages.map(lang => (
                    <span key={lang} className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/10">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Topics</h4>
                <div className="flex flex-wrap gap-1.5">
                  {user.preferences?.topics.map(topic => (
                    <span key={topic} className="text-[10px] font-semibold text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/10">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Level</h4>
                  <span className="text-xs font-semibold text-slate-200 capitalize bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full inline-block">
                    {user.preferences?.skillLevel}
                  </span>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Matching Role</h4>
                  <span className="text-xs font-semibold text-slate-200 capitalize bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full inline-block">
                    {user.preferences?.rolePreference === "both" ? "Helper & Helpee" : user.preferences?.rolePreference}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Finding Room Action Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-indigo-950/20 via-slate-900/40 to-purple-950/10 border border-slate-900 backdrop-blur-md rounded-3xl p-8 shadow-xl flex flex-col justify-between min-h-[400px]">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-xs text-indigo-300 mb-6">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Next Feature: Smart Queueing & Redis Matching</span>
              </div>

              <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
                Pair up and debug DSA in real-time
              </h2>
              <p className="mt-3 text-sm text-slate-400 max-w-xl leading-relaxed">
                When you click "Find Partner", we will add you to our matchmaking queue. We pair you with another user working in your languages who has a similar ELO score. Once paired, you'll be automatically redirected to your collaborative Debug Room.
              </p>
            </div>

            <DashboardMatching
              languages={user.preferences?.languages || []}
              topics={user.preferences?.topics || []}
              skillLevel={user.preferences?.skillLevel || "Intermediate"}
              rolePreference={user.preferences?.rolePreference || "both"}
              elo={user.eloRating}
            />

            <div className="mt-4 text-[10px] text-slate-500 text-center font-medium">
              * Queue timeout penalty applies: Skipping sessions multiple times decreases your matchmaking priority score.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
