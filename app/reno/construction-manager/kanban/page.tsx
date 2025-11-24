"use client";

import { useState } from "react";
import { RenoSidebar } from "@/components/reno/reno-sidebar";
import { NavbarL1 } from "@/components/layout/navbar-l1";
import { RenoKanbanBoard } from "@/components/reno/reno-kanban-board";
import { useI18n } from "@/lib/i18n";

export default function RenoConstructionManagerKanbanPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useI18n();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar L1: Navegación principal de plataforma */}
      <RenoSidebar 
        isMobileOpen={isMobileMenuOpen}
        onMobileToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden w-full md:w-auto">
        {/* Navbar L1: Navegación secundaria con buscador, filtros */}
        <NavbarL1
          classNameTitle={t.property.management}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onFilterClick={() => {
            console.log("Filter - Coming soon");
          }}
        />
        
        {/* Kanban Board */}
        <div 
          className="flex-1 overflow-y-auto md:overflow-hidden p-3 md:p-6 bg-[var(--prophero-gray-50)] dark:bg-[var(--prophero-gray-950)]"
          data-scroll-container
        >
          <RenoKanbanBoard searchQuery={searchQuery} />
        </div>
      </div>
    </div>
  );
}








