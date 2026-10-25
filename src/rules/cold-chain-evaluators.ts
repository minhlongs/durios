import type { ComplianceRule, ContainerDossier, ValidationFinding } from "../domain/types.js";
import { getAseanCorridorProtocol, type AseanTradeCorridorCode } from "./asean-corridor-adapters.js";
import { evaluateGaccRegistryWatch, type GaccCodeRegistryEntry } from "../saas/gacc-registry-watch-service.js";

/**
 * Resolves the active ASEAN trade corridor protocol (default VN_CN) and provides
 * continuous cold-chain temperature bounds [minTemperatureC(corridor), maxTemperatureC(corridor)].
 */
export function minTemperatureC(corridorCode: AseanTradeCorridorCode = "VN_CN"): number {
  return getAseanCorridorProtocol(corridorCode).minTemperatureC;
}

export function maxTemperatureC(corridorCode: AseanTradeCorridorCode = "VN_CN"): number {
  return getAseanCorridorProtocol(corridorCode).maxTemperatureC;
}

export function evaluateColdChainTemperatureAttestation(
  rule: ComplianceRule,
  dossier: ContainerDossier,
  findings: ValidationFinding[]
): void {
  const minTemp = minTemperatureC("VN_CN");
  const maxTemp = maxTemperatureC("VN_CN");
  const observed = dossier.targetTemperatureC;
  if (!Number.isFinite(observed) || observed < minTemp || observed > maxTemp) {
    findings.push({
      ruleId: rule.ruleId,
      severity: rule.severity,
      ruleName: rule.name,
      citation: rule.statutoryReference,
      observedValue: `${observed} C`,
      thresholdValue: `${minTemp} C .. ${maxTemp} C`,
      messageVi: `Nhiệt độ bảo quản chuỗi lạnh (${observed} C) nằm ngoài ngưỡng chuẩn VN-CN (${minTemp}..${maxTemp} C).`,
      messageEn: `Cold-chain target temperature (${observed} C) is outside the VN-CN corridor window (${minTemp}..${maxTemp} C).`,
    });
  }
}

export function evaluateOptionalGaccWatchOnDossier(
  pucCode: string,
  phcCode: string,
  snapshotFeed?: ReadonlyMap<string, GaccCodeRegistryEntry>,
  tenantId?: string
): readonly string[] {
  if (!snapshotFeed || snapshotFeed.size === 0) return [];
  try {
    return evaluateGaccRegistryWatch(pucCode, phcCode, process.env, snapshotFeed, tenantId).alertsVi;
  } catch {
    return [];
  }
}
