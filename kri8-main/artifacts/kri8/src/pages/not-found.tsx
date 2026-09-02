import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Compass, Home, Lightbulb } from "lucide-react";

export default function NotFound() {
  return (
    <NotFoundLayout />
  );
}

function NotFoundLayout() {
  useEffect(() => {
    const splash = document.getElementById("kri8-splash");
    if (splash && !splash.classList.contains("fade-out")) {
      splash.classList.add("fade-out");
      window.setTimeout(() => splash.remove(), 500);
    }
  }, []);

  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#0d1117] px-5 text-white">
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{ background: "hsl(43 74% 52% / 0.18)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full opacity-20 blur-3xl"
        style={{ background: "hsl(228 80% 60% / 0.2)" }}
      />

      <main className="relative z-10 w-full max-w-xl text-center">
        <Link
          href="/"
          className="mb-16 inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-300 transition-colors hover:text-white"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_0_22px_rgba(255,255,255,0.18)]">
            <span className="text-[11px] font-black tracking-tighter text-[#1a1f35]">kri8</span>
          </span>
          kri8
        </Link>

        <div className="relative mx-auto mb-7 flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-xl">
          <Compass className="h-12 w-12 text-[#f3cd57]" strokeWidth={1.25} />
          <span className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full border border-[#d4af37]/30 bg-[#d4af37]/15 text-xs font-bold text-[#f3cd57]">
            404
          </span>
        </div>

        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-[#f3cd57]">
          Off the map
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          This idea got lost.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-slate-400">
          The page you’re looking for doesn’t exist or may have moved. Let’s
          get you back to a place where ideas can grow.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#1a1f35] shadow-lg transition-colors hover:bg-slate-200"
          >
            <Home className="h-4 w-4" />
            Back to home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 text-sm font-semibold text-white transition-colors hover:bg-white/[0.12]"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>
        </div>

        <div className="mt-16 inline-flex items-center gap-2 text-xs text-slate-600">
          <Lightbulb className="h-3.5 w-3.5 text-[#d4af37]" />
          Keep exploring
        </div>
      </main>
    </div>
  );
}
