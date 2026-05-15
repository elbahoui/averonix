import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  FileClock,
  FileText,
  FolderOpen,
  Home,
  Layers3,
  LifeBuoy,
  LogOut,
  Menu,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { isDevTestWorkspaceEnabled } from "@/lib/dev-workspace";
import {
  fetchCompany,
  signOut,
  useAuthSession,
  userToStored,
  type StoredCompany,
  type StoredUser,
} from "@/lib/storage";

type DashboardCtx = {
  user: StoredUser;
  company: Partial<StoredCompany> | null;
  refreshCompany: () => Promise<void>;
};

const Ctx = createContext<DashboardCtx | null>(null);

export function useDashboard() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useDashboard must be used inside DashboardShell");
  return value;
}

type NavTo =
  | "/dashboard"
  | "/frameworks"
  | "/frameworks/iso27001"
  | "/controls"
  | "/evidence-references"
  | "/assessment"
  | "/scan"
  | "/report"
  | "/onboarding"
  | "/integrations";

type NavItem = {
  label: string;
  to?: NavTo;
  href?: string;
  soon?: boolean;
  icon: LucideIcon;
};
type NavGroup = { group: string; items: NavItem[] };
type WorkspaceDiagnostics = {
  sessionFound: boolean;
  organizationFound: boolean | null;
  profileCompleted: boolean | null;
  supabaseError: string | null;
  fallbackMode: boolean;
};

const SIDEBAR_COLLAPSED_KEY = "averonix.sidebar.collapsed";

const NAV: NavGroup[] = [
  {
    group: "Overview",
    items: [
      { label: "Home", to: "/dashboard", icon: Home },
      { label: "Starter guide", href: "/dashboard#next-best-actions", icon: Sparkles },
    ],
  },
  {
    group: "Compliance",
    items: [
      { label: "Frameworks", to: "/frameworks", icon: Layers3 },
      { label: "Controls", to: "/controls", icon: ClipboardCheck },
      { label: "Evidence references", to: "/evidence-references", icon: FolderOpen },
      { label: "Policies", soon: true, icon: FileText },
      { label: "Documents", soon: true, icon: BookOpen },
    ],
  },
  {
    group: "Readiness",
    items: [
      { label: "Manual assessment", to: "/assessment", icon: BarChart3 },
      { label: "Agent evidence", to: "/scan", icon: Zap },
      { label: "Readiness report", to: "/report", icon: FileClock },
    ],
  },
  {
    group: "Workspace",
    items: [
      { label: "Integrations", to: "/integrations", icon: Network },
      { label: "Company", to: "/onboarding", icon: Building2 },
      { label: "Settings", soon: true, icon: Settings },
    ],
  },
];

export function DashboardShell({
  children,
  requireOnboarding = true,
  layout = "sidebar",
}: {
  children: ReactNode;
  requireOnboarding?: boolean;
  layout?: "sidebar" | "topbar";
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { user, loading } = useAuthSession();
  const [company, setCompany] = useState<Partial<StoredCompany> | null>(null);
  const [companyLoaded, setCompanyLoaded] = useState(false);
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);
  const [workspaceError, setWorkspaceError] = useState(false);
  const [diagnostics, setDiagnostics] = useState<WorkspaceDiagnostics>({
    sessionFound: false,
    organizationFound: null,
    profileCompleted: null,
    supabaseError: null,
    fallbackMode: false,
  });

  async function refreshCompany() {
    if (!user) return;
    setWorkspaceError(false);
    setCompanyLoaded(false);
    const fallbackMode = isDevTestWorkspaceEnabled();
    setDiagnostics({
      sessionFound: true,
      organizationFound: null,
      profileCompleted: null,
      supabaseError: null,
      fallbackMode,
    });
    try {
      const currentCompany = await withTimeout(fetchCompany(user.id), 10000);
      const profileCompleted = currentCompany?.onboardingCompleted ?? false;
      setCompany(currentCompany);
      setCompleted(profileCompleted);
      setDiagnostics({
        sessionFound: true,
        organizationFound: !!currentCompany,
        profileCompleted,
        supabaseError: null,
        fallbackMode,
      });
      setCompanyLoaded(true);
    } catch {
      setCompany(null);
      setCompleted(false);
      setWorkspaceError(true);
      setDiagnostics({
        sessionFound: true,
        organizationFound: null,
        profileCompleted: null,
        supabaseError: "Workspace service unavailable.",
        fallbackMode,
      });
      setCompanyLoaded(true);
    }
  }

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    refreshCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id]);

  useEffect(() => {
    if (!companyLoaded || !requireOnboarding) return;
    if (!completed) navigate({ to: "/onboarding" });
  }, [companyLoaded, completed, requireOnboarding, navigate]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    setSidebarCollapsedState(readSidebarCollapsedPreference());
  }, []);

  function setSidebarCollapsed(nextValue: boolean) {
    setSidebarCollapsedState(nextValue);
    writeSidebarCollapsedPreference(nextValue);
  }

  async function logout() {
    await signOut();
    navigate({ to: "/" });
  }

  if (workspaceError && user) {
    return (
      <WorkspaceLoadError
        diagnostics={diagnostics}
        onRetry={refreshCompany}
        onGoToOnboarding={() => navigate({ to: "/onboarding" })}
        onSignOut={logout}
      />
    );
  }

  if (loading || !user || !companyLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFB]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
            Loading workspace...
          </div>
        </div>
      </div>
    );
  }

  const stored = userToStored(user);
  const initials = stored.email ? stored.email.slice(0, 2).toUpperCase() : "U";

  if (layout === "topbar") {
    return (
      <Ctx.Provider value={{ user: stored, company, refreshCompany }}>
        <TopbarWorkspaceShell initials={initials} onSignOut={logout}>
          {children}
        </TopbarWorkspaceShell>
      </Ctx.Provider>
    );
  }

  return (
    <Ctx.Provider value={{ user: stored, company, refreshCompany }}>
      <div className="min-h-screen bg-[#FAFAFB] text-[#111827]">
        <div className="flex min-h-screen">
          <aside
            className={`sticky top-0 hidden h-screen shrink-0 overflow-hidden border-r border-[#E5E7EB] bg-white transition-[width] duration-200 lg:relative lg:flex lg:flex-col ${
              sidebarCollapsed ? "w-[72px]" : "w-[260px]"
            }`}
          >
            <div
              className={`flex shrink-0 items-center border-b border-[#E5E7EB] ${
                sidebarCollapsed
                  ? "h-20 flex-col justify-center gap-2 px-2 py-2"
                  : "h-14 justify-between px-4"
              }`}
            >
              {sidebarCollapsed ? (
                <Logo variant="icon" size="sm" />
              ) : (
                <Logo variant="horizontal" size="sm" showBeta />
              )}
              <button
                type="button"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-pressed={sidebarCollapsed}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`inline-flex items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-[#6B7280] transition hover:border-[#C4B5FD] hover:bg-[#F6F0FF] hover:text-[#7C3AED] ${
                  sidebarCollapsed ? "h-7 w-7" : "h-8 w-8"
                }`}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className={sidebarCollapsed ? "px-2 py-2" : "px-3 py-3"}>
              <div
                className={`flex items-center rounded-md border border-[#E5E7EB] bg-[#F8F8FA] text-xs text-[#6B7280] ${
                  sidebarCollapsed ? "mx-auto h-10 w-10 justify-center px-0" : "gap-2 px-3 py-2"
                }`}
                title={sidebarCollapsed ? "Search" : undefined}
              >
                <Search className="h-4 w-4" />
                {sidebarCollapsed ? null : (
                  <>
                    <span>Search...</span>
                    <span className="ml-auto rounded border border-[#E5E7EB] bg-white px-1.5 py-0.5 text-[10px]">
                      K
                    </span>
                  </>
                )}
              </div>
            </div>
            <div
              className={
                sidebarCollapsed
                  ? "flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  : "flex-1 overflow-y-auto"
              }
            >
              <SidebarNav pathname={pathname} collapsed={sidebarCollapsed} />
            </div>
            <div className="shrink-0 border-t border-[#E5E7EB] p-3">
              <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"}`}>
                {sidebarCollapsed ? (
                  <button
                    type="button"
                    onClick={logout}
                    title={`${stored.email} - Sign out`}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-bold text-white transition hover:bg-[#6D28D9]"
                  >
                    {initials}
                  </button>
                ) : (
                  <>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-bold text-white">
                      {initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-[#111827]">
                        {stored.email}
                      </p>
                      <p className="text-[11px] text-[#6B7280]">Free plan</p>
                    </div>
                  </>
                )}
                {sidebarCollapsed ? null : (
                  <button
                    type="button"
                    onClick={logout}
                    title="Sign out"
                    className="rounded-md p-2 text-[#6B7280] transition hover:bg-[#F6F0FF] hover:text-[#7C3AED]"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </aside>

          {mobileNavOpen ? (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                type="button"
                aria-label="Close navigation"
                className="absolute inset-0 bg-[#111827]/40"
                onClick={() => setMobileNavOpen(false)}
              />
              <aside className="relative flex h-full w-[min(86vw,320px)] flex-col border-r border-[#E5E7EB] bg-white shadow-2xl">
                <div className="flex h-16 items-center justify-between border-b border-[#E5E7EB] px-4">
                  <Logo variant="horizontal" size="md" showBeta />
                  <button
                    type="button"
                    aria-label="Close navigation"
                    className="rounded-md border border-[#E5E7EB] p-2 text-[#6B7280]"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="overflow-y-auto">
                  <SidebarNav pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
                </div>
              </aside>
            </div>
          ) : null}

          <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 sm:px-5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Open navigation"
                  aria-expanded={mobileNavOpen}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E5E7EB] text-[#374151] lg:hidden"
                  onClick={() => setMobileNavOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="lg:hidden">
                  <Logo variant="icon" size="md" showBeta />
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-semibold text-[#111827]">{getBreadcrumb(pathname)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Help"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E5E7EB] text-[#6B7280] transition hover:border-[#7C3AED]/40 hover:text-[#7C3AED]"
                >
                  <LifeBuoy className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="flex h-9 items-center gap-2 rounded-md border border-[#E5E7EB] px-3 text-xs font-semibold text-[#374151] transition hover:border-[#7C3AED]/40 hover:text-[#7C3AED] lg:hidden"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7C3AED] text-[10px] text-white">
                    {initials}
                  </span>
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            </header>
            <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
              {children}
            </main>
          </div>
        </div>
      </div>
    </Ctx.Provider>
  );
}

function TopbarWorkspaceShell({
  children,
  initials,
  onSignOut,
}: {
  children: ReactNode;
  initials: string;
  onSignOut: () => void;
}) {
  return (
    <div className="min-h-screen bg-white text-[#111827]">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 sm:px-5">
        <Logo variant="horizontal" size="sm" imgClassName="h-[34px]" />
        <div className="flex items-center gap-2.5 text-[#0F172A] sm:gap-3">
          <button
            type="button"
            title="Search"
            className="hidden h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#F6F0FF] hover:text-[#7C3AED] sm:flex"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            title="Notifications"
            className="relative hidden h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#F6F0FF] hover:text-[#7C3AED] sm:flex"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
          </button>
          <button
            type="button"
            title="Help"
            className="hidden h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#F6F0FF] hover:text-[#7C3AED] sm:flex"
          >
            <CircleHelp className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={onSignOut}
            title="Sign out"
            className="flex items-center gap-2 rounded-full text-[#0F172A] transition hover:text-[#7C3AED]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C3AED] text-[11px] font-bold text-white shadow-[0_3px_10px_rgba(124,58,237,0.18)]">
              {initials}
            </span>
            <ChevronDown className="hidden h-4 w-4 sm:block" />
          </button>
        </div>
      </header>
      <main className="min-h-[calc(100vh-56px)]">{children}</main>
    </div>
  );
}

function SidebarNav({
  pathname,
  onNavigate,
  collapsed = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <nav className={collapsed ? "space-y-2 px-2 pb-4 pt-1" : "space-y-5 px-3 pb-5"}>
      {NAV.map((group) => (
        <div key={group.group}>
          {collapsed ? (
            <div className="mx-auto my-1 h-px w-7 bg-[#E5E7EB]" title={group.group} />
          ) : (
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">
              {group.group}
            </p>
          )}
          <ul className={collapsed ? "space-y-1.5" : "space-y-1"}>
            {group.items.map((item) => {
              const Icon = item.icon;
              const key = item.to ?? item.href ?? item.label;
              const active = item.to ? isNavActive(pathname, item.to) : false;
              const navClass = collapsed
                ? `group mx-auto flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition ${
                    active
                      ? "bg-[#F6F0FF] text-[#7C3AED] ring-1 ring-[#E9DDF7]"
                      : "text-[#374151] hover:bg-[#F8F8FA] hover:text-[#111827]"
                  }`
                : `group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-[#F6F0FF] text-[#7C3AED] ring-1 ring-[#E9DDF7]"
                      : "text-[#374151] hover:bg-[#F8F8FA] hover:text-[#111827]"
                  }`;

              if (item.soon || (!item.to && !item.href)) {
                return (
                  <li key={key}>
                    <button
                      type="button"
                      disabled
                      title={collapsed ? `${item.label} - Coming soon` : undefined}
                      className={
                        collapsed
                          ? "mx-auto flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-md text-[#9CA3AF] opacity-75"
                          : "flex w-full cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[#9CA3AF] opacity-75"
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {collapsed ? null : (
                        <>
                          <span className="truncate">{item.label}</span>
                          <span className="ml-auto rounded-full border border-[#E5E7EB] bg-[#F8F8FA] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                            Coming soon
                          </span>
                        </>
                      )}
                    </button>
                  </li>
                );
              }

              if (item.href) {
                return (
                  <li key={key}>
                    <a
                      href={item.href}
                      onClick={onNavigate}
                      className={navClass}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {collapsed ? null : <span className="truncate">{item.label}</span>}
                    </a>
                  </li>
                );
              }

              return (
                <li key={key}>
                  <Link
                    to={item.to as never}
                    onClick={onNavigate}
                    className={navClass}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {collapsed ? null : <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function isNavActive(pathname: string, to: NavTo): boolean {
  if (to === "/frameworks")
    return pathname === "/frameworks" || pathname.startsWith("/frameworks/");
  return pathname === to;
}

function getBreadcrumb(pathname: string): string {
  const map: Record<string, string> = {
    "/dashboard": "Home",
    "/frameworks": "Frameworks",
    "/frameworks/iso27001": "Frameworks / ISO/IEC 27001:2022",
    "/controls": "Controls",
    "/evidence-references": "Evidence references",
    "/assessment": "Manual assessment",
    "/scan": "Agent Evidence",
    "/report": "Readiness report",
    "/onboarding": "Company",
    "/integrations": "Integrations",
  };
  return map[pathname] ?? "Workspace";
}

function readSidebarCollapsedPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function writeSidebarCollapsedPreference(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, value ? "true" : "false");
  } catch {
    // Keep the sidebar usable when storage is unavailable.
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("workspace_load_timeout")), timeoutMs);
    promise
      .then((value) => {
        window.clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeout);
        reject(error);
      });
  });
}

function WorkspaceLoadError({
  diagnostics,
  onRetry,
  onGoToOnboarding,
  onSignOut,
}: {
  diagnostics: WorkspaceDiagnostics;
  onRetry: () => void;
  onGoToOnboarding: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFB] px-4">
      <section className="w-full max-w-lg rounded-lg border border-[#E5E7EB] bg-white p-6 text-center shadow-sm">
        <ShieldCheck className="mx-auto h-10 w-10 text-[#7C3AED]" />
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#7C3AED]">
          Workspace load error
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[#111827]">
          Workspace could not be loaded.
        </h1>
        <p className="mt-2 text-sm text-[#6B7280]">Workspace service unavailable.</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-10 items-center justify-center rounded-md bg-[#7C3AED] px-4 text-sm font-semibold text-white transition hover:bg-[#6D28D9]"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={onGoToOnboarding}
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#D1D5DB] px-4 text-sm font-semibold text-[#374151] transition hover:border-[#7C3AED]/40 hover:text-[#7C3AED]"
          >
            Go to onboarding
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#D1D5DB] px-4 text-sm font-semibold text-[#374151] transition hover:border-[#7C3AED]/40 hover:text-[#7C3AED]"
          >
            Sign out
          </button>
        </div>
        {import.meta.env.DEV ? <WorkspaceDiagnosticsPanel diagnostics={diagnostics} /> : null}
      </section>
    </div>
  );
}

function WorkspaceDiagnosticsPanel({ diagnostics }: { diagnostics: WorkspaceDiagnostics }) {
  const rows = [
    ["session found", diagnostics.sessionFound ? "yes" : "no"],
    [
      "organization found",
      diagnostics.organizationFound === null
        ? "unknown"
        : diagnostics.organizationFound
          ? "yes"
          : "no",
    ],
    [
      "profile_completed",
      diagnostics.profileCompleted === null
        ? "unknown"
        : diagnostics.profileCompleted
          ? "yes"
          : "no",
    ],
    ["Supabase error", diagnostics.supabaseError ?? "none"],
    ["fallback mode", diagnostics.fallbackMode ? "yes" : "no"],
  ];

  return (
    <div className="mt-6 rounded-lg border border-[#E5E7EB] bg-[#F8F8FA] p-3 text-left">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7C3AED]">
        Development diagnostics
      </p>
      <dl className="mt-2 space-y-1 text-[11px] text-[#6B7280]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt>{label}</dt>
            <dd className="text-right text-[#111827]">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
