import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  FileText,
  FolderOpen,
  Layers3,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { DashboardShell, useDashboard } from "@/components/layout/DashboardShell";
import {
  HOME_FRAMEWORK_FILTERS,
  HOME_PRIORITY_FILTERS,
  buildHomePriorityActions,
  buildHomeProgressCards,
  deriveHomeAssessmentCounts,
  filterHomePriorityActions,
  filterHomeProgressCards,
  type HomeFrameworkFilter,
  type HomePriorityAction,
  type HomePriorityFilter,
  type HomeProgressCard,
} from "@/lib/compliance/home-dashboard";
import { buildComplianceControlRows, summarizeControls } from "@/lib/compliance/workspace";
import { useComplianceWorkspaceData } from "@/lib/compliance/useWorkspaceData";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Home - Averonix" },
      {
        name: "description",
        content:
          "Averonix workspace overview for ISO/IEC 27001 readiness progress, external signals, and evidence references.",
      },
    ],
  }),
  component: DashboardPage,
});

const CARD_ICONS: Record<HomeProgressCard["id"], LucideIcon> = {
  iso27001: ShieldCheck,
  agent: Zap,
  evidence: FolderOpen,
  report: FileText,
  "nist-csf": Layers3,
  soc2: ClipboardList,
};

function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardInner />
    </DashboardShell>
  );
}

function DashboardInner() {
  const { company } = useDashboard();
  const data = useComplianceWorkspaceData(company);
  const [frameworkFilter, setFrameworkFilter] = useState<HomeFrameworkFilter>("All");
  const [priorityFilter, setPriorityFilter] = useState<HomePriorityFilter>("All");
  const controls = buildComplianceControlRows({
    sector: company?.sector,
    responses: data.responses,
    result: data.result,
  });
  const summary = summarizeControls(controls);
  const { answeredQuestions, totalQuestions } = deriveHomeAssessmentCounts({
    controls,
    result: data.result,
    progress: data.progress,
  });
  const cards = filterHomeProgressCards(
    buildHomeProgressCards({
      controls,
      result: data.result,
      progress: data.progress,
      agent: data.agent,
    }),
    frameworkFilter,
  );
  const actions = filterHomePriorityActions(
    buildHomePriorityActions({
      answeredQuestions,
      totalQuestions,
      result: data.result,
      agent: data.agent,
      weakReferences: summary.needsReferences,
      source: data.source,
    }),
    priorityFilter,
  );
  const overdue = actions.filter((action) => action.section === "overdue");
  const dueSoon = actions.filter((action) => action.section === "due-soon");

  return (
    <section className="mx-auto w-full max-w-[1180px]">
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <header className="mb-5">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
              <h1 className="text-[30px] font-semibold leading-none tracking-[-0.035em] text-[#111827] sm:text-[34px]">
                Home
              </h1>
              {data.sourceNotice ? (
                <p className="inline-flex w-fit rounded-full border border-[#E5E7EB] bg-white px-2 py-0.5 text-[10.5px] font-semibold leading-none text-[#5B6472]">
                  {data.sourceNotice}
                </p>
              ) : null}
            </div>
          </header>

          <div className="mb-4">
            <FilterSelect
              label="Filter by"
              value={frameworkFilter}
              onChange={(value) => setFrameworkFilter(value as HomeFrameworkFilter)}
              options={HOME_FRAMEWORK_FILTERS}
            />
          </div>

          <h2 className="mb-4 text-[22px] font-semibold leading-tight tracking-[-0.02em] text-[#111827] sm:text-[24px]">
            Compliance progress
          </h2>

          {cards.length ? (
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:gap-4">
              {cards.map((card) => (
                <FrameworkProgressCard key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 text-sm text-[#6B7280] shadow-sm">
              No cards match this filter.
            </div>
          )}
        </div>

        <PrioritySidebar
          filter={priorityFilter}
          onFilterChange={setPriorityFilter}
          overdue={overdue}
          dueSoon={dueSoon}
        />
      </div>
    </section>
  );
}

function FrameworkProgressCard({ card }: { card: HomeProgressCard }) {
  const Icon = CARD_ICONS[card.id];
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              card.disabled ? "bg-[#F3F4F6] text-[#9CA3AF]" : "bg-[#F5EDFF] text-[#7C3AED]"
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <h3
                className={`font-semibold leading-tight ${
                  card.disabled
                    ? "text-[15px] text-[#6B7280]"
                    : "text-[15px] text-[#111827] sm:text-[17px]"
                }`}
              >
                {card.title}
              </h3>
              <span
                className={`inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                  card.disabled
                    ? "border-[#E5E7EB] bg-[#F8F8FA] text-[#6B7280]"
                    : "border-[#E9DDF7] bg-[#F3E8FF] text-[#7C3AED]"
                }`}
              >
                {card.badge}
              </span>
            </div>
          </div>
        </div>
        <ChevronRight
          className={`mt-1 h-4 w-4 shrink-0 ${card.disabled ? "text-[#C7CBD1]" : "text-[#111827]"}`}
        />
      </div>

      <div className="mt-2.5">
        <p
          className={`font-semibold leading-tight tracking-[-0.02em] ${
            card.disabled
              ? "text-[20px] text-[#6B7280]"
              : card.value.length > 12
                ? "text-[23px] text-[#111827]"
                : "text-[29px] text-[#111827]"
          }`}
        >
          {card.value}
        </p>
        <CardProgress value={card.progress} />
      </div>

      <div
        className={`mt-auto flex flex-col gap-1 pt-2 text-[12.5px] font-semibold leading-snug sm:flex-row sm:items-center sm:justify-between sm:gap-3 ${
          card.disabled ? "text-[#6B7280]" : "text-[#374151]"
        }`}
      >
        <span className="min-w-0">{card.leftFooter}</span>
        <span className="min-w-0 text-left sm:text-right">{card.rightFooter}</span>
      </div>
    </>
  );
  const className = `group flex w-full max-w-full min-w-0 flex-col overflow-hidden rounded-[10px] border bg-white p-4 shadow-[0_1px_3px_rgba(17,24,39,0.05)] transition ${
    card.disabled
      ? "min-h-[114px] cursor-not-allowed border-[#E5E7EB] opacity-85"
      : "min-h-[142px] border-[#E5E7EB] hover:border-[#C4B5FD] hover:shadow-[0_6px_18px_rgba(17,24,39,0.08)]"
  }`;

  if (card.to && !card.disabled) {
    return (
      <Link to={card.to} className={className} aria-label={`Open ${card.title}`}>
        {content}
      </Link>
    );
  }

  return (
    <article className={className} aria-disabled={card.disabled}>
      {content}
    </article>
  );
}

function PrioritySidebar({
  filter,
  onFilterChange,
  overdue,
  dueSoon,
}: {
  filter: HomePriorityFilter;
  onFilterChange: (filter: HomePriorityFilter) => void;
  overdue: HomePriorityAction[];
  dueSoon: HomePriorityAction[];
}) {
  return (
    <aside className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-5 xl:sticky xl:top-6 xl:max-h-[calc(100vh-104px)] xl:overflow-y-auto">
      <div className="space-y-5">
        <FilterSelect
          label="Filter by"
          value={filter}
          onChange={(value) => onFilterChange(value as HomePriorityFilter)}
          options={HOME_PRIORITY_FILTERS}
        />

        <PrioritySection
          title="Items overdue"
          icon={AlertCircle}
          iconClassName="text-red-600"
          actions={overdue}
          emptyText="No overdue items."
        />

        <div className="h-px bg-[#E5E7EB]" />

        <PrioritySection
          title="Items due soon"
          icon={CalendarClock}
          iconClassName="text-amber-500"
          actions={dueSoon}
          emptyText="No due-soon items."
        />
      </div>
    </aside>
  );
}
function PrioritySection({
  title,
  icon: Icon,
  iconClassName,
  actions,
  emptyText,
}: {
  title: string;
  icon: LucideIcon;
  iconClassName: string;
  actions: HomePriorityAction[];
  emptyText: string;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconClassName}`} />
        <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[#111827]">{title}</h2>
      </div>

      {actions.length ? (
        <div className="space-y-2">
          {actions.map((action) => (
            <PriorityActionCard key={action.id} action={action} />
          ))}
        </div>
      ) : (
        <div className="rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 py-3 text-sm text-[#6B7280] shadow-sm">
          {emptyText}
        </div>
      )}
    </section>
  );
}

function PriorityActionCard({ action }: { action: HomePriorityAction }) {
  return (
    <Link
      to={action.to}
      className="flex min-h-[66px] items-center gap-2.5 rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-[#111827] shadow-[0_1px_3px_rgba(17,24,39,0.05)] transition hover:border-[#C4B5FD] hover:shadow-[0_5px_14px_rgba(17,24,39,0.07)]"
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          action.priority === "High"
            ? "bg-red-500"
            : action.priority === "Medium"
              ? "bg-amber-500"
              : "bg-[#7C3AED]"
        }`}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-snug">{action.title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-[#6B7280]">{action.detail}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#111827]" />
    </Link>
  );
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
}) {
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#111827]">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-8 min-w-[124px] rounded-lg border border-[#D1D5DB] bg-white px-2.5 text-sm font-medium text-[#111827] shadow-sm outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
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

function CardProgress({ value }: { value: number | null }) {
  const clamped = value === null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
      <div
        className={`h-full rounded-full bg-[#7C3AED] transition-all ${value === null ? "opacity-0" : ""}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
