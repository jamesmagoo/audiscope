"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { CaseList } from "@/components/cases/case-list"
import { CaseFilters } from "@/components/cases/case-filters"

export default function CasesPage() {
  const [filters, setFilters] = useState({
    status: undefined as string | undefined,
    searchTerm: undefined as string | undefined,
    sortBy: "date-desc",
  })

  const handleFilterChange = (newFilters: { status?: string; searchTerm?: string; sortBy?: string }) => {
    setFilters({
      ...filters,
      ...newFilters,
    })
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <DashboardHeader title="Cases" description="Manage and view all your EVeNTs assessments" />

      <CaseFilters onFilterChange={handleFilterChange} />
      <CaseList statusFilter={filters.status} searchTerm={filters.searchTerm} sortBy={filters.sortBy} />
    </div>
  )
}
