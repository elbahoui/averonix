import { createFileRoute } from "@tanstack/react-router";
import { Cloud, Github, Mail, Server, Shield } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  PageHeader,
  StatusPill,
  TableWrap,
  WorkspaceCard,
} from "@/components/compliance/WorkspacePrimitives";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations - Averonix" },
      { name: "description", content: "Planned integration evidence for future readiness checks." },
    ],
  }),
  component: IntegrationsPage,
});

const INTEGRATIONS = [
  {
    name: "Microsoft 365",
    type: "Identity and productivity",
    icon: Mail,
    plannedSignals: "MFA status, external sharing, audit logs",
  },
  {
    name: "Google Workspace",
    type: "Identity and productivity",
    icon: Shield,
    plannedSignals: "2-Step verification, Drive sharing, admin audit logs",
  },
  {
    name: "GitHub",
    type: "Code and repository",
    icon: Github,
    plannedSignals: "Branch protection, access review, security alerts",
  },
  {
    name: "Cloudflare",
    type: "DNS and edge",
    icon: Cloud,
    plannedSignals: "DNS, TLS mode, WAF and edge security settings",
  },
  {
    name: "AWS / Azure",
    type: "Cloud infrastructure",
    icon: Server,
    plannedSignals: "Identity, logging, network exposure, storage policy review",
  },
];

function IntegrationsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Workspace"
          title="Integrations"
          description="Connectors are planned for future evidence automation. No integrations are active in this demo."
        />

        <WorkspaceCard className="p-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-[#7C3AED] bg-[#F6F0FF] px-3 py-2 text-sm font-semibold text-[#7C3AED]"
            >
              Available
            </button>
            <button
              type="button"
              className="rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-semibold text-[#374151]"
            >
              Planned
            </button>
          </div>
          <p className="mt-3 text-sm text-[#6B7280]">
            Available connectors are empty for this controlled demo. Planned connectors are
            disabled.
          </p>
        </WorkspaceCard>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {INTEGRATIONS.map((integration) => {
            const Icon = integration.icon;
            return (
              <WorkspaceCard key={integration.name} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#F8F8FA] text-[#7C3AED]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-[#111827]">{integration.name}</h2>
                      <StatusPill tone="gray">Coming soon</StatusPill>
                    </div>
                    <p className="mt-1 text-sm text-[#6B7280]">{integration.type}</p>
                    <p className="mt-3 text-sm text-[#5B6472]">{integration.plannedSignals}</p>
                    <button
                      type="button"
                      disabled
                      className="mt-4 inline-flex min-h-10 cursor-not-allowed items-center justify-center rounded-md border border-[#D1D5DB] bg-white px-4 text-sm font-semibold text-[#9CA3AF]"
                    >
                      Coming soon
                    </button>
                  </div>
                </div>
              </WorkspaceCard>
            );
          })}
        </section>

        <WorkspaceCard>
          <div className="border-b border-[#E5E7EB] p-4">
            <h2 className="text-lg font-semibold text-[#111827]">Planned evidence automation</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Future integrations should provide read-only external evidence references and remain
              user-controlled.
            </p>
          </div>
          <TableWrap>
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#E5E7EB] bg-[#F8F8FA] text-xs uppercase tracking-[0.08em] text-[#6B7280]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Connector</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Planned signals</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {INTEGRATIONS.map((integration) => (
                  <tr key={integration.name}>
                    <td className="px-4 py-4 font-medium text-[#111827]">{integration.name}</td>
                    <td className="px-4 py-4">
                      <StatusPill tone="gray">Coming soon</StatusPill>
                    </td>
                    <td className="min-w-[320px] px-4 py-4 text-[#5B6472]">
                      {integration.plannedSignals}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        disabled
                        className="cursor-not-allowed rounded-md border border-[#D1D5DB] px-3 py-1.5 text-xs font-semibold text-[#9CA3AF]"
                      >
                        Coming soon
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </WorkspaceCard>
      </div>
    </DashboardShell>
  );
}
