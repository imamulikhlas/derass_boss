export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-white p-6 relative overflow-hidden select-none">
      {/* Background decoration elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Login */}
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-end items-center z-20">
        <button
          type="button"
          className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.7)] border border-red-500/40 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          Login
        </button>
      </header>

      {/* Main Content */}
      <div className="z-10 text-center max-w-4xl mx-auto space-y-6">
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-400 to-yellow-500 drop-shadow-[0_10px_20px_rgba(239,68,68,0.3)]">
          DERASS NIH BOSSS
        </h1>

        <div className="pt-2">
          <button
            type="button"
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-extrabold text-base sm:text-lg tracking-wider uppercase shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:shadow-[0_0_40px_rgba(239,68,68,0.8)] border border-red-400/40 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            Login Member
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-xs text-zinc-600 font-mono tracking-wide">
        &copy; {new Date().getFullYear()} GameId. All rights reserved.
      </footer>
    </main>
  );
}
