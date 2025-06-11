"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, SlidersHorizontal } from "lucide-react"

interface CaseFiltersProps {
  onFilterChange?: (filters: { status?: string; searchTerm?: string; sortBy?: string }) => void
}

export function CaseFilters({ onFilterChange }: CaseFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [status, setStatus] = useState("all")
  const [sortBy, setSortBy] = useState("date-desc")

  const handleStatusChange = (value: string) => {
    setStatus(value)
    if (onFilterChange) {
      onFilterChange({
        status: value === "all" ? undefined : value,
        searchTerm,
        sortBy,
      })
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    if (onFilterChange) {
      onFilterChange({
        status: status === "all" ? undefined : status,
        searchTerm: e.target.value,
        sortBy,
      })
    }
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    if (onFilterChange) {
      onFilterChange({
        status: status === "all" ? undefined : status,
        searchTerm,
        sortBy: value,
      })
    }
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search cases..." className="pl-8" value={searchTerm} onChange={handleSearchChange} />
        </div>
        <Button variant="outline" size="icon">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="sr-only">Advanced filters</span>
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Date (Newest)</SelectItem>
            <SelectItem value="date-asc">Date (Oldest)</SelectItem>
            <SelectItem value="score-desc">Score (High to Low)</SelectItem>
            <SelectItem value="score-asc">Score (Low to High)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
