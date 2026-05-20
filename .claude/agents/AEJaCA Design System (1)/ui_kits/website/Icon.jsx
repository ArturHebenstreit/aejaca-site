/* AEJaCA UI Kit — minimal Lucide-style icon set (inline SVG).
   Default stroke 2, currentColor, no fill. Sized via `size` prop. */

function Icon({ d, size = 16, strokeWidth = 2, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {d}
    </svg>
  );
}

const ArrowRight = (p) => <Icon {...p} d={<><path d="M5 12h14" /><path d="M13 5l7 7-7 7" /></>} />;
const ChevronDown = (p) => <Icon {...p} d={<path d="M6 9l6 6 6-6" />} />;
const Menu = (p) => <Icon {...p} d={<><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>} />;
const X = (p) => <Icon {...p} d={<><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>} />;
const Globe = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 010 18" /><path d="M12 3a14 14 0 000 18" /></>} />;
const StarFilled = ({ size = 16, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" aria-hidden="true" {...rest}>
    <polygon points="12,2 15.1,8.6 22,9.4 17,14.3 18.3,21.2 12,17.8 5.7,21.2 7,14.3 2,9.4 8.9,8.6" />
  </svg>
);
const Sparkles = (p) => <Icon {...p} d={<><path d="M12 3l1.5 4 4 1.5-4 1.5L12 14l-1.5-4-4-1.5 4-1.5z" /><path d="M19 14l.8 2 2 .8-2 .8L19 20l-.8-2-2-.8 2-.8z" /><path d="M5 17l.6 1.5 1.5.6-1.5.6L5 21l-.6-1.5L3 18.8l1.4-.6z" /></>} />;
const FileUp = (p) => <Icon {...p} d={<><path d="M14 3v5h5" /><path d="M19 8v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2h7z" /><path d="M9 14l3-3 3 3" /><path d="M12 11v6" /></>} />;
const Printer = (p) => <Icon {...p} d={<><path d="M6 9V3h12v6" /><rect x="3" y="9" width="18" height="9" rx="2" /><path d="M7 18v3h10v-3" /></>} />;
const Flame = (p) => <Icon {...p} d={<path d="M12 2c1 4 5 5 5 10a5 5 0 11-10 0c0-2 1-3 2-4-1 3 1 4 2 3-2-2 0-5 1-9z" />} />;
const Cpu = (p) => <Icon {...p} d={<><rect x="6" y="6" width="12" height="12" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M9 2v3M12 2v3M15 2v3M9 19v3M12 19v3M15 19v3M2 9h3M2 12h3M2 15h3M19 9h3M19 12h3M19 15h3" /></>} />;
const Scissors = (p) => <Icon {...p} d={<><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" /></>} />;
const Zap = (p) => <Icon {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />} />;
const Mail = (p) => <Icon {...p} d={<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>} />;
const MessageCircleMore = (p) => <Icon {...p} d={<><path d="M21 12a9 9 0 11-3.5-7.1L21 4l-1 3.5A9 9 0 0121 12z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></>} />;
const Instagram = (p) => <Icon {...p} d={<><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" /></>} />;
const Facebook = (p) => <Icon {...p} d={<path d="M14 9V6a1 1 0 011-1h3V2h-3a4 4 0 00-4 4v3H8v3h2v9h3v-9h2.5l.5-3H14z" />} />;
const Youtube = (p) => <Icon {...p} d={<><rect x="2" y="6" width="20" height="12" rx="3" /><polygon points="10 9 16 12 10 15 10 9" fill="currentColor" stroke="none" /></>} />;
const Music2 = (p) => <Icon {...p} d={<><circle cx="8" cy="18" r="3" /><path d="M11 18V5l9-2v13" /></>} />;
const Store = (p) => <Icon {...p} d={<><path d="M3 9l1.5-5h15L21 9" /><path d="M3 9v11h18V9" /><path d="M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0" /><path d="M9 22v-6h6v6" /></>} />;

Object.assign(window, {
  Icon, ArrowRight, ChevronDown, Menu, X, Globe, StarFilled,
  Sparkles, FileUp, Printer, Flame, Cpu, Scissors, Zap,
  Mail, MessageCircleMore, Instagram, Facebook, Youtube, Music2, Store,
});
