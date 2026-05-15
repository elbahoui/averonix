import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

export type StatusTone = "green" | "amber" | "red" | "purple" | "gray" | "blue";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7C3AED]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.01em] text-[#111827] sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm text-[#5B6472]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function WorkspaceCard({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`rounded-lg border border-[#E5E7EB] bg-white shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

export function StatusPill({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  const styles: Record<StatusTone, string> = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    purple: "border-[#E9DDF7] bg-[#F6F0FF] text-[#7C3AED]",
    gray: "border-gray-200 bg-gray-50 text-gray-600",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

export function ThinProgress({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EEF0F4]">
      <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function MetricCard({
  label,
  value,
  subtext,
  tone = "purple",
  progress,
}: {
  label: string;
  value: string;
  subtext?: string;
  tone?: StatusTone;
  progress?: number;
}) {
  return (
    <WorkspaceCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">{label}</p>
        <span
          className={`mt-1 h-2 w-2 rounded-full ${
            tone === "green"
              ? "bg-emerald-500"
              : tone === "amber"
                ? "bg-amber-500"
                : tone === "red"
                  ? "bg-red-500"
                  : tone === "blue"
                    ? "bg-blue-500"
                    : tone === "gray"
                      ? "bg-gray-400"
                      : "bg-[#7C3AED]"
          }`}
        />
      </div>
      <p className="mt-3 text-2xl font-semibold text-[#111827]">{value}</p>
      {progress !== undefined ? (
        <div className="mt-3">
          <ThinProgress value={progress} />
        </div>
      ) : null}
      {subtext ? <p className="mt-2 text-xs text-[#6B7280]">{subtext}</p> : null}
    </WorkspaceCard>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#E5E7EB] p-4 sm:flex-row sm:flex-wrap sm:items-center">
      {children}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="min-h-10 min-w-0 flex-1 rounded-md border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
    />
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <label className="flex min-w-[160px] flex-col gap-1 text-xs font-medium text-[#6B7280] sm:min-w-[180px]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 rounded-md border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  to,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  to?: string;
}) {
  return (
    <WorkspaceCard className="p-8 text-center">
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[#6B7280]">{description}</p>
      {actionLabel && to ? (
        <Link
          to={to as never}
          className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-[#7C3AED] px-4 text-sm font-semibold text-white transition hover:bg-[#6D28D9]"
        >
          {actionLabel}
        </Link>
      ) : null}
    </WorkspaceCard>
  );
}

export function PrimaryLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to as never}
      className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#7C3AED] px-4 text-sm font-semibold text-white transition hover:bg-[#6D28D9]"
    >
      {children}
    </Link>
  );
}

export function SecondaryLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to as never}
      className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#D1D5DB] bg-white px-4 text-sm font-semibold text-[#374151] transition hover:border-[#7C3AED]/50 hover:text-[#7C3AED]"
    >
      {children}
    </Link>
  );
}

/* ─── SummaryStrip ─── */

export type SummaryStripItem = {
  label: string;
  value: string;
  tone?: StatusTone;
};

export function SummaryStrip({ items }: { items: SummaryStripItem[] }) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
      <div className="flex flex-wrap divide-x divide-[#E5E7EB]">
        {items.map((item) => (
          <div key={item.label} className="flex-1 min-w-[140px] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B7280]">
              {item.label}
            </p>
            <div className="mt-1 flex items-center gap-2">
              {item.tone ? (
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    item.tone === "green"
                      ? "bg-emerald-500"
                      : item.tone === "amber"
                        ? "bg-amber-500"
                        : item.tone === "red"
                          ? "bg-red-500"
                          : item.tone === "blue"
                            ? "bg-blue-500"
                            : item.tone === "gray"
                              ? "bg-gray-400"
                              : "bg-[#7C3AED]"
                  }`}
                />
              ) : null}
              <span className="text-sm font-semibold text-[#111827]">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Pagination ─── */

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
        <span>
          {total} {total === 1 ? "item" : "items"}
        </span>
        {onPageSizeChange ? (
          <>
            <span>·</span>
            <label className="flex items-center gap-1">
              Rows
              <select
                value={pageSize}
                onChange={(e) => {
                  onPageSizeChange(Number(e.target.value));
                  onPageChange(1);
                }}
                className="rounded border border-[#D1D5DB] bg-white px-1.5 py-1 text-xs text-[#111827] outline-none"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </label>
          </>
        ) : null}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-[#D1D5DB] px-2.5 py-1.5 text-xs font-medium text-[#374151] transition hover:border-[#7C3AED]/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Prev
        </button>
        <span className="px-2 text-xs text-[#6B7280]">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-[#D1D5DB] px-2.5 py-1.5 text-xs font-medium text-[#374151] transition hover:border-[#7C3AED]/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function usePagination(totalItems: number, initialSize = 25) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return { page, pageSize, setPage, setPageSize, start, end, totalPages };
}

/* ─── SidePanel ─── */

export function SidePanel({
  open,
  onClose,
  title,
  subtitle,
  badges,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badges?: ReactNode;
  children: ReactNode;
}) {
  // Lock body scroll when panel is open on mobile
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Mobile: full-screen drawer overlay */}
      <div className="fixed inset-0 z-40 lg:hidden">
        <button
          type="button"
          aria-label="Close panel"
          className="absolute inset-0 bg-[#111827]/30"
          onClick={onClose}
        />
        <aside className="absolute inset-x-0 bottom-0 top-12 overflow-y-auto rounded-t-xl border-t border-[#E5E7EB] bg-white shadow-2xl">
          <div className="sticky top-0 z-10 border-b border-[#E5E7EB] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {subtitle ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7C3AED]">
                    {subtitle}
                  </p>
                ) : null}
                <h2 className="mt-1 text-lg font-semibold text-[#111827] leading-snug">{title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-[#D1D5DB] px-3 py-1.5 text-sm font-semibold text-[#374151]"
              >
                Close
              </button>
            </div>
            {badges ? <div className="mt-3 flex flex-wrap gap-2">{badges}</div> : null}
          </div>
          <div className="p-4 space-y-4">{children}</div>
        </aside>
      </div>

      {/* Desktop: inline sticky panel — rendered by parent in layout */}
      <aside className="hidden lg:block">
        <div className="sticky top-6 max-h-[calc(100vh-4rem)] overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
          <div className="sticky top-0 z-10 border-b border-[#E5E7EB] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {subtitle ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7C3AED]">
                    {subtitle}
                  </p>
                ) : null}
                <h2 className="mt-1 text-base font-semibold text-[#111827] leading-snug">
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-[#D1D5DB] px-2.5 py-1 text-xs font-semibold text-[#374151]"
              >
                Close
              </button>
            </div>
            {badges ? <div className="mt-3 flex flex-wrap gap-2">{badges}</div> : null}
          </div>
          <div className="p-4 space-y-4">{children}</div>
        </div>
      </aside>
    </>
  );
}
