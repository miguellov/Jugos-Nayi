/**
 * Capa fija de color: gradientes suaves tipo jugos cítricos + menta (solo decoración).
 */
export default function JuiceBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute -top-48 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-200/50 via-orange-100/20 to-transparent blur-3xl dark:from-amber-500/15 dark:via-orange-400/10 dark:to-transparent" />
      <div className="absolute -right-24 top-[8%] h-[min(95vw,26rem)] w-[min(95vw,26rem)] rounded-full bg-gradient-to-bl from-amber-300/45 via-orange-200/30 to-transparent blur-3xl dark:from-amber-600/12 dark:via-orange-500/8 dark:to-transparent" />
      <div className="absolute -left-28 top-[28%] h-[min(85vw,22rem)] w-[min(85vw,22rem)] rounded-full bg-gradient-to-br from-emerald-400/35 via-teal-300/20 to-transparent blur-3xl dark:from-emerald-500/15 dark:via-teal-600/10 dark:to-transparent" />
      <div className="absolute bottom-[6%] right-[5%] h-64 w-64 rounded-full bg-gradient-to-tl from-rose-300/30 to-amber-100/25 blur-3xl dark:from-rose-500/10 dark:to-amber-600/8" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-brand/12 to-transparent dark:from-brand/25 dark:to-transparent" />
      <div className="absolute inset-0 opacity-[0.45] mix-blend-multiply [background-size:18px_18px] [background-image:radial-gradient(rgba(29,158,117,0.09)_1px,transparent_1px)] dark:opacity-[0.25] dark:mix-blend-soft-light dark:[background-image:radial-gradient(rgba(29,158,117,0.14)_1px,transparent_1px)]" />
    </div>
  )
}
