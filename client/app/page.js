import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center relative overflow-hidden">
      
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Pill Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card border-blue-500/30 text-xs font-medium text-blue-400 mb-8 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        The Developer Social &amp; Portfolio Platform
      </div>

      {/* Main Heading */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight">
        Build Your Portfolio. <br />
        <span className="gradient-text">Connect With Developers.</span>
      </h1>

      {/* Subtitle */}
      <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
        DevConnect empowers software engineers to showcase public GitHub projects, share code updates, follow fellow builders, and engage in real-time technical discussions.
      </p>

      {/* CTA Buttons */}
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center">
        <Link
          href="/register"
          className="gradient-button text-white font-semibold text-base px-8 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 hover:scale-105 transition-all w-full sm:w-auto"
        >
          Create Free Account &rarr;
        </Link>
        <Link
          href="/feed"
          className="glass-card hover:bg-slate-800/80 text-slate-200 font-medium text-base px-8 py-3.5 rounded-xl border border-slate-700/80 transition-all w-full sm:w-auto"
        >
          Explore Feed
        </Link>
      </div>

      {/* Feature Showcase Grid */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
        
        {/* Card 1 */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xl font-bold mb-4">
            🐙
          </div>
          <h3 className="text-xl font-semibold text-slate-100 mb-2">Automated GitHub Sync</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Connect your GitHub account to showcase your public repositories, tech stacks, and live star counters automatically on your profile.
          </p>
        </div>

        {/* Card 2 */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xl font-bold mb-4">
            💬
          </div>
          <h3 className="text-xl font-semibold text-slate-100 mb-2">Community Discussions</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Share technical posts with image attachments, like peer updates, and discuss engineering topics in threaded comments.
          </p>
        </div>

        {/* Card 3 */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-xl font-bold mb-4">
            🔍
          </div>
          <h3 className="text-xl font-semibold text-slate-100 mb-2">Instant Developer Search</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Discover engineers by name, skills, or tech stack, filter developer profiles, and explore popular code discussions.
          </p>
        </div>

      </div>

      {/* Developer Profile Preview Card */}
      <div className="mt-16 w-full max-w-3xl glass-card rounded-2xl p-6 border-slate-800 text-left shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-bold flex items-center justify-center text-base">
              A
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">@alexdev</h4>
              <p className="text-xs text-slate-400">Full Stack Engineer • React, Node.js &amp; PostgreSQL</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            Active Developer
          </span>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          &quot;Just shipped our updated feed query pipeline! Connecting with fellow developers on DevConnect has been an awesome way to showcase open source work.&quot;
        </p>

        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">TypeScript</span>
          <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">Next.js</span>
          <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">PostgreSQL</span>
          <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">Redis</span>
        </div>
      </div>

    </div>
  );
}
