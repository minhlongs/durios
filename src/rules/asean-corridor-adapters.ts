import type { DocumentType } from "../domain/types.js";

export type AseanTradeCorridorCode = "VN_CN" | "MY_CN" | "TH_CN" | "PH_CN";

export interface AseanCorridorProtocolSpec {
  readonly corridorCode: AseanTradeCorridorCode;
  readonly originCountryIso2: "VN" | "MY" | "TH" | "PH";
  readonly destinationCountryIso2: "CN";
  readonly corridorNameVi: string;
  readonly statutoryFramework: string;
  readonly originAuthorityCode: string;
  readonly destinationAuthorityCode: "GACC";
  readonly maxCadmiumMgKg: number;
  readonly minTemperatureC: number;
  readonly maxTemperatureC: number;
  readonly requiresRegisteredOrchardPuc: boolean;
  readonly requiresApprovedPackhousePhc: boolean;
  readonly requiresContainerInspectionAndSeal: boolean;
  readonly minimumDryMatterPct?: number | undefined;
  readonly mandatoryDocumentTypes: readonly DocumentType[];
}

export const ASEAN_CORRIDOR_REGISTRY: Readonly<
  Record<AseanTradeCorridorCode, AseanCorridorProtocolSpec>
> = {
  VN_CN: {
    corridorCode: "VN_CN",
    originCountryIso2: "VN",
    destinationCountryIso2: "CN",
    corridorNameVi: "Việt Nam sang Trung Quốc (Nghị định thư sầu riêng tươi)",
    statutoryFramework: "GACC Decree / Nghị định thư Bộ NN&PTNT - GACC",
    originAuthorityCode: "PPD-VN (Cục Bảo vệ thực vật)",
    destinationAuthorityCode: "GACC",
    maxCadmiumMgKg: 0.05,
    minTemperatureC: 12,
    maxTemperatureC: 15,
    requiresRegisteredOrchardPuc: true,
    requiresApprovedPackhousePhc: true,
    requiresContainerInspectionAndSeal: true,
    mandatoryDocumentTypes: [
      "PACKING_LIST",
      "LAB_TEST_REPORT",
      "PHYTOSANITARY_CERTIFICATE",
    ],
  },
  MY_CN: {
    corridorCode: "MY_CN",
    originCountryIso2: "MY",
    destinationCountryIso2: "CN",
    corridorNameVi: "Malaysia sang Trung Quốc (Nghị định thư sầu riêng tươi 2024)",
    statutoryFramework: "MAFI-GACC Protocol for Fresh Durian 2024",
    originAuthorityCode: "DOA-MY (Department of Agriculture Malaysia)",
    destinationAuthorityCode: "GACC",
    maxCadmiumMgKg: 0.05,
    minTemperatureC: 12,
    maxTemperatureC: 15,
    requiresRegisteredOrchardPuc: true,
    requiresApprovedPackhousePhc: true,
    requiresContainerInspectionAndSeal: true,
    mandatoryDocumentTypes: [
      "PACKING_LIST",
      "LAB_TEST_REPORT",
      "PHYTOSANITARY_CERTIFICATE",
    ],
  },
  TH_CN: {
    corridorCode: "TH_CN",
    originCountryIso2: "TH",
    destinationCountryIso2: "CN",
    corridorNameVi: "Thái Lan sang Trung Quốc (Tiêu chuẩn kiểm dịch & độ khô)",
    statutoryFramework: "MOAC-GACC Fresh Fruit Protocol & Thai Agricultural Standard TAS 3-2013",
    originAuthorityCode: "DOA-TH (Department of Agriculture Thailand)",
    destinationAuthorityCode: "GACC",
    maxCadmiumMgKg: 0.05,
    minTemperatureC: 13,
    maxTemperatureC: 15,
    requiresRegisteredOrchardPuc: true,
    requiresApprovedPackhousePhc: true,
    requiresContainerInspectionAndSeal: true,
    minimumDryMatterPct: 32,
    mandatoryDocumentTypes: [
      "PACKING_LIST",
      "LAB_TEST_REPORT",
      "PHYTOSANITARY_CERTIFICATE",
    ],
  },
  PH_CN: {
    corridorCode: "PH_CN",
    originCountryIso2: "PH",
    destinationCountryIso2: "CN",
    corridorNameVi: "Philippines (Davao) sang Trung Quốc",
    statutoryFramework: "DA-BPI Protocol for Fresh Durian to China 2023",
    originAuthorityCode: "BPI-PH (Bureau of Plant Industry)",
    destinationAuthorityCode: "GACC",
    maxCadmiumMgKg: 0.05,
    minTemperatureC: 12,
    maxTemperatureC: 15,
    requiresRegisteredOrchardPuc: true,
    requiresApprovedPackhousePhc: true,
    requiresContainerInspectionAndSeal: true,
    mandatoryDocumentTypes: [
      "PACKING_LIST",
      "LAB_TEST_REPORT",
      "PHYTOSANITARY_CERTIFICATE",
    ],
  },
};

export function getAseanCorridorProtocol(
  corridorCode: AseanTradeCorridorCode
): AseanCorridorProtocolSpec {
  const protocol = ASEAN_CORRIDOR_REGISTRY[corridorCode];
  if (!protocol) {
    throw new Error(`Unsupported ASEAN trade corridor '${corridorCode}'.`);
  }
  return protocol;
}

export function listSupportedAseanCorridors(): readonly AseanCorridorProtocolSpec[] {
  return Object.values(ASEAN_CORRIDOR_REGISTRY);
}
