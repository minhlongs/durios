import type {
  AuthenticatedActor,
  ExtractedField,
  IngestedDocument,
} from "../domain/types.js";
import type { AuditLedgerLike } from "../workspace/workspace-types.js";

export interface HumanVerificationInput {
  readonly fieldId: string;
  readonly confirmedValue: string | number;
  readonly clerkNote?: string | undefined;
  readonly rejectField?: boolean | undefined;
}

export class HitlVerificationService {
  constructor(private readonly auditLedger: AuditLedgerLike) {}

  public verifyOrCorrectField(
    document: IngestedDocument,
    input: HumanVerificationInput,
    actor: AuthenticatedActor
  ): IngestedDocument {
    const fieldIndex = document.extractedFields.findIndex((f) => f.id === input.fieldId);
    if (fieldIndex === -1) {
      throw new Error(`Field '${input.fieldId}' not found on document '${document.id}'`);
    }

    const currentField = document.extractedFields[fieldIndex]!;
    const isEdited = String(currentField.rawValue) !== String(input.confirmedValue);
    const newStatus = input.rejectField ? "REJECTED" : "HUMAN_VERIFIED";

    const updatedField: ExtractedField = {
      ...currentField,
      verificationStatus: newStatus,
      confirmedValue: input.rejectField ? null : input.confirmedValue,
      verifiedBy: actor.name,
      verifiedAt: new Date().toISOString(),
      clerkNote: input.clerkNote,
    };

    const updatedFields = [...document.extractedFields];
    updatedFields[fieldIndex] = updatedField;

    this.auditLedger.recordEvent(
      actor,
      document.dossierId,
      isEdited ? "FIELD_MANUALLY_EDITED" : "FIELD_HUMAN_VERIFIED",
      "EXTRACTED_FIELD",
      currentField.id,
      {
        fieldKey: currentField.fieldKey,
        rawValue: currentField.rawValue,
        verificationStatus: currentField.verificationStatus,
      },
      {
        fieldKey: updatedField.fieldKey,
        confirmedValue: updatedField.confirmedValue,
        verificationStatus: updatedField.verificationStatus,
        isEdited,
        clerkNote: input.clerkNote ?? null,
      }
    );

    return {
      ...document,
      extractedFields: updatedFields,
    };
  }

  public areAllFieldsVerified(documents: readonly IngestedDocument[]): boolean {
    const activeDocs = documents.filter((d) => !d.isSuperseded);
    for (const doc of activeDocs) {
      for (const field of doc.extractedFields) {
        if (field.verificationStatus !== "HUMAN_VERIFIED") {
          return false;
        }
      }
    }
    return true;
  }
}
