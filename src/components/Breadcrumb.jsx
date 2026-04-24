import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs mb-6">
      {items.map((item, i) => (
        <span key={item.href || i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="w-3 h-3 text-neutral-600" />}
          {i < items.length - 1 ? (
            <Link to={item.href} className="text-amber-400/80 hover:text-amber-300 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-neutral-400 truncate max-w-[200px] sm:max-w-none">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
