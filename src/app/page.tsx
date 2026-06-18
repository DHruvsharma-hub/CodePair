import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { 
  Code2, 
  Terminal, 
  Users, 
  MessageSquare, 
  Play, 
  Flame, 
  Trophy, 
  Sparkles, 
  ArrowRight,
  User,
  ShieldAlert
} from "lucide-react";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  const features = [
    {
      icon: <Users className="h-6 w-6 text-indigo-400" />,
      title: "Smart 1-on-1 Matching",
      description: "Match with coders of similar skill level (ELO ±200) and language preference to debug and solve problems together."
    },
    {
      icon: <Code2 className="h-6 w-6 text-indigo-400" />,
      title: "Real-time Collaborative Editor",
      description: "Code together in a shared Monaco editor with Yjs CRDT. View each other's live cursor, selection, and drop inline comments."
    },
    {
      icon: <Terminal className="h-6 w-6 text-indigo-400" />,
      title: "Shared Compiler Output",
      description: "Run code collaboratively through Judge0 supporting 50+ languages. View outputs, test cases, and diffs side-by-side."
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-indigo-400" />,
      title: "Rich Chat & Voice Notes",
      description: "Communicate through instant messages with code snippets and send short, 30-second browser voice notes for fast debugging."
    },
    {
      icon: <Sparkles className="h-6 w-6 text-indigo-400" />,
      title: "AI Co-pilot Hints & Summaries",
      description: "Get stuck? Request smart hints that guide you without giving the solution. Receive detailed session summary logs afterward."
    },
    {
      icon: <Flame className="h-6 w-6 text-indigo-400" />,
      title: "Streaks & ELO Gamification",
      description: "Earn custom badges (like 'Graph Wizard'), increase your daily streak, and climb the global leaderboard as your ELO updates."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-slate-900 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-400 bg-clip-text text-transparent">
              DSA Debug Room
            </span>
          </div>

          <nav className="flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/profile/setup"
                  className="text-sm font-medium text-slate-300 hover:text-white transition"
                >
                  Edit Profile
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-4 h-9 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg transition-all shadow-md shadow-indigo-600/10"
                >
                  Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-300 hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?signup=true"
                  className="inline-flex items-center justify-center px-4 h-9 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg transition-all shadow-md shadow-indigo-600/10"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center relative">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-xs text-indigo-300 mb-8 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-indigo-400" />
            <span>Interactive Peer-to-Peer Debugging Platform</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto text-white">
            Solve DSA Problems{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              Collaboratively in Real-Time
            </span>
          </h1>
          
          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Stop coding in isolation. Match instantly with peer coders of your skill level to collaboratively write, debug, compile, and learn data structures & algorithms.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-8 h-12 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl transition-all shadow-lg shadow-indigo-600/20 w-full sm:w-auto"
              >
                Go to Matchmaking <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login?signup=true"
                  className="inline-flex items-center justify-center px-8 h-12 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl transition-all shadow-lg shadow-indigo-600/20 w-full sm:w-auto"
                >
                  Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 h-12 text-base font-semibold text-slate-200 border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 backdrop-blur-sm rounded-xl transition w-full sm:w-auto"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Interactive UI Mockup */}
          <div className="mt-20 border border-slate-900 bg-slate-950/60 rounded-2xl p-2 md:p-4 shadow-2xl relative overflow-hidden backdrop-blur-md max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
            <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4 px-2">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/60 block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60 block" />
                <span className="w-3 h-3 rounded-full bg-green-500/60 block" />
                <span className="text-xs text-slate-500 ml-2">DSA Debug Room: /room/session_c8a7b1</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-medium">Timer: 45:23</span>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">Partner: connected</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
              {/* Left problem */}
              <div className="md:col-span-1 bg-slate-900/50 p-4 rounded-xl border border-slate-800/40 h-80 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white mb-2">124. Binary Tree Maximum Path Sum</h4>
                  <span className="inline-block text-[10px] font-semibold text-rose-400 bg-rose-400/10 px-1.5 py-0.5 rounded mb-3">Hard</span>
                  <p className="text-xs text-slate-400 leading-normal line-clamp-6">
                    A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them... Find the maximum path sum of any non-empty path.
                  </p>
                </div>
                <div className="text-xs text-slate-500 border-t border-slate-800/50 pt-2">
                  Topic: <span className="text-indigo-300">Trees, DFS</span>
                </div>
              </div>

              {/* Center Code Editor */}
              <div className="md:col-span-2 bg-[#1e1e1e] p-4 rounded-xl border border-slate-800/60 h-80 font-mono text-xs text-indigo-200/90 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="text-slate-500 mb-2">// Collaborative coding in C++</div>
                  <div><span className="text-purple-400">int</span> <span className="text-blue-400">maxPathSum</span>(TreeNode* root) &#123;</div>
                  <div className="pl-4"><span className="text-purple-400">int</span> max_sum = INT_MIN;</div>
                  <div className="pl-4">maxGain(root, max_sum);</div>
                  <div className="pl-4 bg-indigo-500/10 border-l-2 border-indigo-500 py-0.5 my-0.5 pr-2 flex justify-between items-center">
                    <span><span className="text-purple-400">return</span> max_sum;</span>
                    <span className="bg-indigo-600 text-[10px] text-white px-1 rounded">You</span>
                  </div>
                  <div className="pl-0">&#125;</div>
                  <div className="mt-4"><span className="text-purple-400">int</span> <span className="text-blue-400">maxGain</span>(TreeNode* node, <span className="text-purple-400">int</span>& max_sum) &#123;</div>
                  <div className="pl-4 text-purple-400">if <span className="text-slate-200">(node == nullptr)</span> return 0;</div>
                  <div className="pl-4 bg-purple-500/10 border-l-2 border-purple-500 py-0.5 my-0.5 pr-2 flex justify-between items-center">
                    <span><span className="text-purple-400">int</span> leftGain = max(maxGain(node-&gt;left, max_sum), 0);</span>
                    <span className="bg-purple-600 text-[10px] text-white px-1 rounded">Alex (Helper)</span>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs font-mono text-emerald-400 flex items-center justify-between">
                  <span>✔ All test cases passed (3ms)</span>
                  <span className="text-slate-500">Judge0 API</span>
                </div>
              </div>

              {/* Right Chat Panel */}
              <div className="md:col-span-1 bg-slate-900/50 p-4 rounded-xl border border-slate-800/40 h-80 flex flex-col justify-between">
                <div className="space-y-3 overflow-y-auto">
                  <div className="text-xs">
                    <span className="font-semibold text-purple-400">Alex:</span>
                    <span className="text-slate-300 block bg-slate-950 p-1.5 rounded mt-1">We need to reset gain if it is negative!</span>
                  </div>
                  <div className="text-xs text-right">
                    <span className="font-semibold text-indigo-400">You:</span>
                    <span className="text-slate-300 block bg-indigo-950/40 text-left p-1.5 rounded mt-1">Ah, got it. Added `max(..., 0)` to leftGain. Let's run.</span>
                  </div>
                </div>
                <div className="border-t border-slate-800/50 pt-2 flex items-center space-x-1">
                  <div className="bg-slate-950 text-slate-400 text-[10px] px-2 py-1.5 rounded flex-1">Type message...</div>
                  <button className="bg-indigo-600 text-white rounded p-1.5 hover:bg-indigo-500">
                    <Play className="h-3 w-3 fill-current rotate-90" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-900">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Designed for Accelerated Learning & Collaboration
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed">
              We combine robust development tools, real-time sync, and smart pairing algorithms to build the ultimate playground for mastering algorithms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-slate-900/30 border border-slate-900/80 rounded-2xl p-6 hover:border-slate-800 hover:bg-slate-900/50 transition duration-300 flex flex-col space-y-4"
              >
                <div className="h-12 w-12 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-center shadow-inner">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-br from-indigo-950/50 via-slate-950 to-purple-950/30 py-24 border-t border-slate-900 relative">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Ready to elevate your DSA skills?
            </h2>
            <p className="mt-4 text-slate-300 max-w-xl mx-auto">
              Create an account now, set your preferences, match with a developer, and start solving problems together.
            </p>
            <div className="mt-8">
              <Link
                href="/login?signup=true"
                className="inline-flex items-center justify-center px-8 h-12 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-lg shadow-indigo-600/20"
              >
                Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-xs">
          <div>
            &copy; {new Date().getFullYear()} DSA Debug Room. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-slate-300 transition">Terms of Service</a>
            <a href="#" className="hover:text-slate-300 transition">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition">Github Project</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
