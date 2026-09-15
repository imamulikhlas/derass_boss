export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-white p-6 relative overflow-hidden select-none">
      {/* Background decoration elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content */}
      <div className="z-10 text-center max-w-4xl mx-auto space-y-6">
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-400 to-yellow-500 drop-shadow-[0_10px_20px_rgba(239,68,68,0.3)]">
          DERASS NIH BOSSS
        </h1>

        
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-xs text-zinc-600 font-mono tracking-wide">
        &copy; {new Date().getFullYear()} GameId. All rights reserved.
      </footer>
    </main>
  );
}
