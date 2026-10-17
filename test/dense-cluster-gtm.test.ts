import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateDenseClusterReadiness,
  MEKONG_DELTA_CLUSTER_TARGETS,
  type ClusterOrganizationNode,
  type ClusterVerifiedEdge,
} from "../src/sharing/dense-cluster-readiness.js";

function buildFullMekongClusterNodes(): ClusterOrganizationNode[] {
  const nodes: ClusterOrganizationNode[] = [];
  for (let i = 1; i <= 8; i++) {
    nodes.push({
      orgId: `PH-${i}`,
      orgName: `Vựa Cai Lậy ${i}`,
      role: "PACKHOUSE",
      province: "Tiền Giang",
      verifiedProfileActive: true,
    });
  }
  for (let i = 1; i <= 3; i++) {
    nodes.push({
      orgId: `EXP-${i}`,
      orgName: `Exporter ĐBSCL ${i}`,
      role: "EXPORTER",
      province: "Tiền Giang",
      verifiedProfileActive: true,
    });
  }
  for (let i = 1; i <= 2; i++) {
    nodes.push({
      orgId: `LAB-${i}`,
      orgName: `Lab Kiểm Nghiệm ${i}`,
      role: "ACCREDITED_LAB",
      province: "TP.HCM",
      verifiedProfileActive: true,
    });
  }
  for (let i = 1; i <= 3; i++) {
    nodes.push({
      orgId: `LOG-${i}`,
      orgName: `Logistics Lạnh ${i}`,
      role: "COLD_CHAIN_LOGISTICS",
      province: "Tiền Giang",
      verifiedProfileActive: true,
    });
  }
  for (let i = 1; i <= 5; i++) {
    nodes.push({
      orgId: `BUY-${i}`,
      orgName: `Buyer Importer ${i}`,
      role: "BUYER_IMPORTER",
      province: "Guangxi",
      verifiedProfileActive: true,
    });
  }
  return nodes;
}

describe("Step 15: Dense Cluster GTM Playbook & Readiness Evaluator", () => {
  it("blocks cluster expansion when Cai Lay beachhead GATE-05 or paid conversion is not yet met", () => {
    const nodes = buildFullMekongClusterNodes();
    const blockedGate05 = evaluateDenseClusterReadiness({
      beachheadGate05Passed: false,
      beachheadPaidConversionConfirmed: false,
      nodes,
      edges: [],
    });

    expect(blockedGate05.expansionAuthorized).toBe(false);
    expect(blockedGate05.clusterTargetsMet).toBe(false);
    expect(blockedGate05.blockReasonVi).toContain("GATE-05");

    const blockedWtp = evaluateDenseClusterReadiness({
      beachheadGate05Passed: true,
      beachheadPaidConversionConfirmed: false,
      nodes,
      edges: [],
    });

    expect(blockedWtp.expansionAuthorized).toBe(false);
    expect(blockedWtp.clusterTargetsMet).toBe(false);
    expect(blockedWtp.blockReasonVi).toContain("WTP Kill Criterion #1");
  });

  it("authorizes cluster expansion and verifies Mekong Delta targets (8 PH, 3 EXP, 2 LAB, 3 LOG, 5 BUY)", () => {
    const nodes = buildFullMekongClusterNodes();
    const edges: ClusterVerifiedEdge[] = [
      { fromOrgId: "PH-1", toOrgId: "EXP-1", verifiedContainersCount: 5 },
      { fromOrgId: "LAB-1", toOrgId: "PH-1", verifiedContainersCount: 5 },
      { fromOrgId: "LOG-1", toOrgId: "EXP-1", verifiedContainersCount: 5 },
      { fromOrgId: "EXP-1", toOrgId: "BUY-1", verifiedContainersCount: 5 },
    ];

    const report = evaluateDenseClusterReadiness({
      beachheadGate05Passed: true,
      beachheadPaidConversionConfirmed: true,
      nodes,
      edges,
    });

    expect(report.expansionAuthorized).toBe(true);
    expect(report.blockReasonVi).toBeUndefined();
    expect(report.countsByRole.PACKHOUSE).toBe(MEKONG_DELTA_CLUSTER_TARGETS.targetPackhouses);
    expect(report.countsByRole.EXPORTER).toBe(MEKONG_DELTA_CLUSTER_TARGETS.targetExporters);
    expect(report.countsByRole.ACCREDITED_LAB).toBe(MEKONG_DELTA_CLUSTER_TARGETS.targetLabs);
    expect(report.countsByRole.COLD_CHAIN_LOGISTICS).toBe(
      MEKONG_DELTA_CLUSTER_TARGETS.targetColdChainLogistics
    );
    expect(report.countsByRole.BUYER_IMPORTER).toBe(
      MEKONG_DELTA_CLUSTER_TARGETS.targetBuyerImporters
    );
    expect(report.totalActiveNodes).toBe(21);
    expect(report.totalVerifiedEdges).toBe(4);
    expect(report.networkDensityScore).toBeGreaterThan(0);
    expect(report.clusterTargetsMet).toBe(true);
  });

  it("confirms all 25 steps in plans/company-blueprint/tasks.md are marked [x] [COMPLETED]", () => {
    const tasksMd = readFileSync(
      join(process.cwd(), "plans/company-blueprint/tasks.md"),
      "utf-8"
    );
    const completedLines = tasksMd.match(/^- \[x\] \*\*Step \d+:/gm) ?? [];
    const uncompletedLines = tasksMd.match(/^- \[ \] \*\*Step \d+:/gm) ?? [];
    expect(completedLines.length).toBe(25);
    expect(uncompletedLines.length).toBe(0);
  });
});
