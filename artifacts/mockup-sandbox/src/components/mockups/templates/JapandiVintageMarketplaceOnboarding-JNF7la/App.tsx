import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

const STEPS = [
  {
    index: '01',
    kanji: '発見',
    eyebrow: 'The Hunt',
    title: 'Scout the\narchive.',
    body:
      'Twelve thousand pieces, hand-pulled from estates, ateliers and forgotten warehouses. Filter by decade, maker, or the story you want to wear.',
    image:
      'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=900&h=1200&fit=crop',
    detail: 'Levi’s Big E · 1968 · Found in Osaka',
  },
  {
    index: '02',
    kanji: '証明',
    eyebrow: 'The Proof',
    title: 'Demand the\nprovenance.',
    body:
      'Every garment is examined by our archivists — stitch counts, selvedge IDs, union tags. If it cannot be proven, it does not enter the house.',
    image:
      'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=900&h=1200&fit=crop',
    detail: 'Schott Perfecto · 1979 · Verified in 14 points',
  },
  {
    index: '03',
    kanji: '継承',
    eyebrow: 'The Wear',
    title: 'Carry it\nforward.',
    body:
      'These clothes outlived their first owners. Wear them harder. Repair them honestly. When you are done, pass them on through us — the ledger remembers.',
    image:
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&h=1200&fit=crop',
    detail: 'Yohji wool coat · 1991 · Third custodian',
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
  exit: {
    transition: { staggerChildren: 0.04, staggerDirection: -1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: -14, transition: { duration: 0.3, ease: 'easeIn' } },
};

const imageVariants = {
  hidden: { opacity: 0, scale: 1.08 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, transition: { duration: 0.35 } },
};

export default function App() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const next = () => setStep((s) => (isLast ? 0 : s + 1));

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#E7DFD3] py-10 px-4 relative overflow-hidden">
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600&family=Noto+Serif+JP:wght@300&display=swap"
        rel="stylesheet"
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            * { -webkit-font-smoothing: antialiased; }
            body { margin: 0; }
            .fr { font-family: 'Fraunces', serif; }
            .kanji-vertical {
              writing-mode: vertical-rl;
              font-family: 'Noto Serif JP', 'Fraunces', serif;
              letter-spacing: 0.5em;
            }
            .grain::after {
              content: '';
              position: absolute;
              inset: 0;
              pointer-events: none;
              opacity: 0.5;
              mix-blend-mode: multiply;
              background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
            }
            .hairline { background: linear-gradient(to right, #4A3F35 0%, #4A3F35 100%); height: 1px; }
            .cta-line { transition: transform 0.45s cubic-bezier(0.22,1,0.36,1); transform-origin: left; }
            .cta:hover .cta-line { transform: scaleX(1); }
            .cta:hover .cta-arrow { transform: translateX(4px); }
            .cta-arrow { transition: transform 0.35s cubic-bezier(0.22,1,0.36,1); }
            .dot { transition: all 0.5s cubic-bezier(0.22,1,0.36,1); }
          `,
        }}
      />

      {/* ambient backdrop typography */}
      <div className="hidden lg:block absolute left-12 top-1/2 -translate-y-1/2 select-none">
        <p className="fr font-light text-[#4A3F35]/40 text-sm tracking-[0.45em] uppercase rotate-180" style={{ writingMode: 'vertical-rl' }}>
          Sashiko House — Vintage, proven & passed on
        </p>
      </div>
      <div className="hidden lg:block absolute right-12 bottom-12 select-none text-right">
        <p className="fr font-light text-[#4A3F35]/50 text-xs tracking-[0.35em] uppercase">Onboarding · Sequence {current.index} / 03</p>
      </div>

      {/* Phone */}
      <div
        className="relative w-[390px] h-[800px] bg-[#F4EDE2] overflow-hidden flex flex-col grain"
        style={{
          borderRadius: '14px',
          boxShadow:
            '0 1px 2px rgba(58,48,40,0.10), 0 24px 60px -12px rgba(58,48,40,0.35), 0 0 0 1px rgba(58,48,40,0.08)',
        }}
      >
        {/* ============ TOP HALF — dark, image ============ */}
        <div className="relative h-1/2 bg-[#2A231D] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={current.image}
              src={current.image}
              alt={current.eyebrow}
              variants={imageVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="absolute inset-0 w-full h-full object-cover opacity-70"
              style={{ filter: 'sepia(0.25) contrast(0.95) brightness(0.9)' }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-b from-[#2A231D]/30 via-transparent to-[#2A231D]/85" />

          {/* status bar suggestion */}
          <div className="absolute top-0 inset-x-0 flex items-center justify-between px-7 pt-5 z-10">
            <span className="fr font-semibold text-[#EFE6D8] text-[13px] tracking-[0.18em]">SASHIKO</span>
            <button className="fr font-light text-[#EFE6D8]/70 text-[11px] tracking-[0.3em] uppercase hover:text-[#EFE6D8] transition-colors">
              Skip
            </button>
          </div>

          {/* vertical kanji */}
          <AnimatePresence mode="wait">
            <motion.span
              key={current.kanji}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              className="kanji-vertical absolute right-7 top-16 text-[#EFE6D8]/85 text-2xl font-light z-10"
            >
              {current.kanji}
            </motion.span>
          </AnimatePresence>

          {/* big index number, straddling the seam */}
          <AnimatePresence mode="wait">
            <motion.span
              key={current.index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0, transition: { delay: 0.25, duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              className="fr font-light absolute left-6 -bottom-9 text-[112px] leading-none text-[#EFE6D8] z-20 select-none"
              style={{ letterSpacing: '-0.04em' }}
            >
              {current.index}
            </motion.span>
          </AnimatePresence>

          {/* provenance detail tag */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current.detail}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.55, duration: 0.6 } }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="absolute bottom-5 right-7 z-10 text-right"
            >
              <p className="fr font-light text-[#EFE6D8]/75 text-[10px] tracking-[0.22em] uppercase border-r border-[#EFE6D8]/40 pr-3">
                {current.detail}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ============ BOTTOM HALF — cream, content ============ */}
        <div className="relative h-1/2 bg-[#F4EDE2] px-7 pt-14 pb-7 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex flex-col flex-1"
            >
              <motion.div variants={itemVariants} className="flex items-center gap-3 mb-4">
                <span className="hairline w-8 opacity-50" />
                <span className="fr font-semibold text-[#8A6A4F] text-[11px] tracking-[0.34em] uppercase">
                  {current.eyebrow}
                </span>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="fr font-semibold text-[#33291F] text-[40px] leading-[1.02] whitespace-pre-line mb-5"
                style={{ letterSpacing: '-0.015em' }}
              >
                {current.title}
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="fr font-light text-[#5C5044] text-[14.5px] leading-[1.65] max-w-[300px]"
              >
                {current.body}
              </motion.p>

              <div className="flex-1" />

              {/* progress + CTA row */}
              <motion.div variants={itemVariants} className="flex items-end justify-between">
                <div className="flex items-center gap-2 pb-1">
                  {STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      aria-label={`Go to step ${i + 1}`}
                      className="dot h-[3px] cursor-pointer"
                      style={{
                        width: i === step ? 34 : 12,
                        backgroundColor: i === step ? '#33291F' : '#C9BCA9',
                      }}
                    />
                  ))}
                </div>

                <button
                  onClick={next}
                  className="cta group flex items-center gap-3 bg-[#33291F] text-[#F0E8DB] pl-6 pr-5 py-4 hover:bg-[#241C14] transition-colors duration-300"
                  style={{ borderRadius: '2px' }}
                >
                  <span className="relative fr font-semibold text-[12px] tracking-[0.22em] uppercase">
                    {isLast ? 'Begin the hunt' : 'Next'}
                    <span className="cta-line absolute -bottom-1 left-0 right-0 h-px bg-[#F0E8DB]/60 scale-x-0" />
                  </span>
                  {isLast ? (
                    <ArrowUpRight size={16} strokeWidth={1.75} className="cta-arrow" />
                  ) : (
                    <ArrowRight size={16} strokeWidth={1.75} className="cta-arrow" />
                  )}
                </button>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* seam hairline */}
          <div className="absolute top-0 left-7 right-7 h-px bg-[#33291F]/0" />
        </div>
      </div>

      {/* caption under phone for storytelling context */}
      <div className="hidden md:block absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
        <p className="fr font-light text-[#5C5044]/70 text-[11px] tracking-[0.3em] uppercase">
          Sashiko House — Old clothes for people with somewhere to be
        </p>
      </div>
    </div>
  );
}