/**
 * Configuration for Reno Construction Manager Kanban phases
 */
export type RenoKanbanPhase = 
  | "upcoming-settlements"
  | "initial-check"
  | "reno-budget"
  | "reno-in-progress"
  | "furnishing-cleaning"
  | "final-check"
  | "reno-fixes"
  | "done"
  | "orphaned"; // Fase para propiedades que no están en ninguna vista de Airtable (no visible)

export interface RenoKanbanColumn {
  key: RenoKanbanPhase;
  stage: RenoKanbanPhase;
  translationKey: keyof {
    upcomingSettlements: string;
    initialCheck: string;
    renoBudget: string;
    renoInProgress: string;
    furnishingCleaning: string;
    finalCheck: string;
    renoFixes: string;
    done: string;
  };
}

export const renoKanbanColumns: RenoKanbanColumn[] = [
  { key: "upcoming-settlements", stage: "upcoming-settlements", translationKey: "upcomingSettlements" },
  { key: "initial-check", stage: "initial-check", translationKey: "initialCheck" },
  { key: "reno-budget", stage: "reno-budget", translationKey: "renoBudget" },
  { key: "reno-in-progress", stage: "reno-in-progress", translationKey: "renoInProgress" },
  { key: "furnishing-cleaning", stage: "furnishing-cleaning", translationKey: "furnishingCleaning" },
  { key: "final-check", stage: "final-check", translationKey: "finalCheck" },
  { key: "reno-fixes", stage: "reno-fixes", translationKey: "renoFixes" },
  { key: "done", stage: "done", translationKey: "done" },
];

// Visible columns (excluding hidden phases)
export const visibleRenoKanbanColumns: RenoKanbanColumn[] = renoKanbanColumns.filter(
  (column) => column.key !== "reno-fixes" && column.key !== "done" && column.key !== "orphaned"
);








