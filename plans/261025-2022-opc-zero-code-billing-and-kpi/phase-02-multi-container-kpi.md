---
title: "Phase 2 — Multi-Container KPI Value Metrics Aggregation"
description: "Extend pilot-kpi-evaluator.ts and pilot-kpi-extended-types.ts to evaluate and aggregate economic value metrics across all N containers."
status: ready
phase: 2
---

# Phase 2: Multi-Container KPI Value Metrics Aggregation

## Context

In `src/auth/pilot-kpi-evaluator.ts:49`, `computeGate05KpiFromDossiers` currently computes:
```ts
const firstContainerMetrics = dossiers.length > 0 ? evaluateFirstContainerValueMetrics(dossiers[0]!) : undefined;
```
While `firstContainerMetrics` is kept for backward compatibility, a 5-container Cai Lậy pilot or Hùng Hậu executive briefing requires evaluating all $N$ containers (`allContainerValueMetrics`) and computing the aggregate summary (`aggregateValueMetrics`: total and mean minutes saved, human touches per container, total exceptions discovered, and total expected loss avoided in VND across the entire cohort).

## Requirements

1. **`src/auth/pilot-kpi-extended-types.ts` (<= 95 LOC):**
   - Keep `FirstContainerValueMetrics`, `MANUAL_BASELINE_MINUTES`, `PENALTY_AVOIDANCE_VND_PER_CRITICAL_EXCEPTION`, and `evaluateFirstContainerValueMetrics` unchanged for backward compatibility.
   - Add `AggregateContainerValueMetrics` interface:
     - `evaluatedContainerCount: number`
     - `meanMinutesSavedPerContainer: number`
     - `totalMinutesSaved: number`
     - `meanHumanTouchesPerContainer: number`
     - `totalExceptionsDiscovered: number`
     - `totalExpectedLossAvoidedVnd: number`
     - `perContainerMetrics: readonly FirstContainerValueMetrics[]`
   - Implement `evaluateAggregateContainerValueMetrics(dossiers: readonly ContainerDossier[]): AggregateContainerValueMetrics`.

2. **`src/auth/pilot-kpi-evaluator.ts` (<= 95 LOC):**
   - Add `readonly aggregateValueMetrics?: AggregateContainerValueMetrics | undefined;` to `Gate05KpiEvaluationReport`.
   - Populate `aggregateValueMetrics` in `computeGate05KpiFromDossiers(dossiers)` alongside `firstContainerMetrics`.

3. **`test/pilot-kpi-multi-container.test.ts` (<= 95 LOC):**
   - Verify that across a 5-container pilot cohort (including clean containers and blind-fault containers with critical blockers), `computeGate05KpiFromDossiers` accurately computes `aggregateValueMetrics` across all 5 containers (`totalExpectedLossAvoidedVnd`, `meanMinutesSavedPerContainer`, `meanHumanTouchesPerContainer`, `perContainerMetrics.length === 5`) while preserving `firstContainerMetrics`.
