export const colorSchemes = {
  light: {
      bg: 'bg-neutral-50',
      text: 'text-neutral-900',
      subtext: 'text-neutral-500',
      p1: { bg: 'bg-neutral-900', text: 'text-white', border: 'border-neutral-900' },
      p2: { bg: 'bg-white', text: 'text-neutral-900', border: 'border-neutral-900' },
      lines: { outer: '#e5e5e5', inner: '#262626' },
      node: { valid: 'bg-neutral-900', default: 'bg-neutral-300' },
      indicator: { ring: 'border-neutral-400', glow: 'bg-neutral-900/5 hover:bg-neutral-900/10' }
  },
  dark: {
      bg: 'bg-zinc-950',
      text: 'text-zinc-100',
      subtext: 'text-zinc-500',
      p1: { bg: 'bg-gradient-to-br from-zinc-100 to-zinc-300 shadow-[0_0_12px_rgba(255,255,255,0.2)]', text: 'text-zinc-900', border: 'border-zinc-200' },
      p2: { bg: 'bg-gradient-to-br from-zinc-800 to-black shadow-lg', text: 'text-zinc-100', border: 'border-zinc-600' },
      lines: { outer: '#52525b', inner: '#d4d4d8' }, // Much brighter lines
      node: { valid: 'bg-zinc-100', default: 'bg-zinc-800' },
      indicator: { ring: 'border-zinc-100', glow: 'bg-white/5 hover:bg-white/10' }
  },
  midnight: {
      bg: 'bg-slate-950',
      text: 'text-indigo-100',
      subtext: 'text-slate-500',
      p1: { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-400' },
      p2: { bg: 'bg-slate-800', text: 'text-indigo-200', border: 'border-slate-600' },
      lines: { outer: '#6366f1', inner: '#818cf8' },
      node: { valid: 'bg-indigo-400', default: 'bg-slate-900' },
      indicator: { ring: 'border-indigo-400', glow: 'bg-indigo-500/20' }
  },
  forest: {
      bg: 'bg-emerald-950',
      text: 'text-emerald-100',
      subtext: 'text-emerald-600',
      p1: { bg: 'bg-emerald-400', text: 'text-emerald-950', border: 'border-emerald-300' },
      p2: { bg: 'bg-emerald-900', text: 'text-emerald-200', border: 'border-emerald-700' },
      lines: { outer: '#10b981', inner: '#34d399' },
      node: { valid: 'bg-emerald-300', default: 'bg-emerald-900' },
      indicator: { ring: 'border-emerald-300', glow: 'bg-emerald-400/20' }
  },
  sunset: {
      bg: 'bg-rose-950',
      text: 'text-rose-100',
      subtext: 'text-rose-600',
      p1: { bg: 'bg-orange-400', text: 'text-orange-950', border: 'border-orange-300' },
      p2: { bg: 'bg-rose-900', text: 'text-rose-200', border: 'border-rose-700' },
      lines: { outer: '#f43f5e', inner: '#fb7185' },
      node: { valid: 'bg-orange-300', default: 'bg-rose-900' },
      indicator: { ring: 'border-orange-300', glow: 'bg-orange-400/20' }
  },
  cyberpunk: {
      bg: 'bg-black',
      text: 'text-neon-pink', // Tailwind needs custom or fallback
      subtext: 'text-neutral-500',
      p1: { bg: 'bg-cyan-400', text: 'text-black', border: 'border-cyan-200' },
      p2: { bg: 'bg-fuchsia-600', text: 'text-white', border: 'border-fuchsia-400' },
      lines: { outer: '#06b6d4', inner: '#e879f9' },
      node: { valid: 'bg-cyan-200', default: 'bg-neutral-900' },
      indicator: { ring: 'border-cyan-400', glow: 'bg-cyan-400/30' }
  }
};
