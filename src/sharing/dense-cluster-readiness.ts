export type ClusterNodeRole = "PACKHOUSE" | "EXPORTER" | "ACCREDITED_LAB" | "COLD_CHAIN_LOGISTICS" | "BUYER_IMPORTER";

export interface ClusterOrganizationNode {
  readonly orgId: string; readonly orgName: string; readonly role: ClusterNodeRole;
  readonly province: string; readonly verifiedProfileActive: boolean;
}

export interface ClusterVerifiedEdge {
  readonly fromOrgId: string; readonly toOrgId: string; readonly verifiedContainersCount: number;
}

export interface MekongClusterTargetSpec {
  readonly targetPackhouses: number; readonly targetExporters: number;
  readonly targetLabs: number; readonly targetColdChainLogistics: number; readonly targetBuyerImporters: number;
}

export const MEKONG_DELTA_CLUSTER_TARGETS: MekongClusterTargetSpec = {
  targetPackhouses: 8, targetExporters: 3, targetLabs: 2, targetColdChainLogistics: 3, targetBuyerImporters: 5,
};

export interface DenseClusterEvaluationReport {
  readonly clusterCode: "MEKONG_DELTA_TIENGIANG_01";
  readonly beachheadGate05Passed: boolean;
  readonly beachheadPaidConversionConfirmed: boolean;
  readonly expansionAuthorized: boolean;
  readonly blockReasonVi?: string | undefined;
  readonly countsByRole: Readonly<Record<ClusterNodeRole, number>>;
  readonly totalActiveNodes: number;
  readonly totalVerifiedEdges: number;
  readonly networkDensityScore: number;
  readonly clusterTargetsMet: boolean;
}

export function evaluateDenseClusterReadiness(input: {
  readonly beachheadGate05Passed: boolean;
  readonly beachheadPaidConversionConfirmed: boolean;
  readonly nodes: readonly ClusterOrganizationNode[];
  readonly edges: readonly ClusterVerifiedEdge[];
  readonly targets?: MekongClusterTargetSpec | undefined;
}): DenseClusterEvaluationReport {
  const targets = input.targets ?? MEKONG_DELTA_CLUSTER_TARGETS;
  const activeNodes = input.nodes.filter((n) => n.verifiedProfileActive);
  const activeIds = new Set(activeNodes.map((n) => n.orgId));

  const countsByRole: Record<ClusterNodeRole, number> = {
    PACKHOUSE: 0, EXPORTER: 0, ACCREDITED_LAB: 0, COLD_CHAIN_LOGISTICS: 0, BUYER_IMPORTER: 0,
  };
  for (const node of activeNodes) countsByRole[node.role]++;

  const validEdges = input.edges.filter(
    (e) =>
      e.fromOrgId !== e.toOrgId &&
      activeIds.has(e.fromOrgId) &&
      activeIds.has(e.toOrgId) &&
      e.verifiedContainersCount > 0
  );

  const n = activeNodes.length;
  const maxPossibleDirectedEdges = n > 1 ? n * (n - 1) : 1;
  const rawDensity = n > 1 ? validEdges.length / maxPossibleDirectedEdges : 0;
  const networkDensityScore = Math.min(1.0, Number(rawDensity.toFixed(4)));

  const expansionAuthorized =
    input.beachheadGate05Passed && input.beachheadPaidConversionConfirmed;

  let blockReasonVi: string | undefined;
  if (!input.beachheadGate05Passed) {
    blockReasonVi =
      "Chưa vượt qua cổng GATE-05 (5 container diễn tập < 5 phút, bắt 100% lỗi gài mù) tại vựa Cai Lậy.";
  } else if (!input.beachheadPaidConversionConfirmed) {
    blockReasonVi =
      "Vựa đầu tiên tại Cai Lậy chưa ký hợp đồng chuyển đổi trả phí (WTP Kill Criterion #1).";
  }

  const clusterTargetsMet = expansionAuthorized && countsByRole.PACKHOUSE >= targets.targetPackhouses && countsByRole.EXPORTER >= targets.targetExporters && countsByRole.ACCREDITED_LAB >= targets.targetLabs && countsByRole.COLD_CHAIN_LOGISTICS >= targets.targetColdChainLogistics && countsByRole.BUYER_IMPORTER >= targets.targetBuyerImporters;
  return {
    clusterCode: "MEKONG_DELTA_TIENGIANG_01",
    beachheadGate05Passed: input.beachheadGate05Passed,
    beachheadPaidConversionConfirmed: input.beachheadPaidConversionConfirmed,
    expansionAuthorized,
    blockReasonVi,
    countsByRole,
    totalActiveNodes: n,
    totalVerifiedEdges: validEdges.length,
    networkDensityScore,
    clusterTargetsMet,
  };
}
