"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Fragment } from "react"

// Route label mapping for readable breadcrumbs
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  cases: "Cases",
  upload: "Upload Assessment",
  assistant: "Assistant",
  products: "Product Library",
  analytics: "Analytics",
  team: "Team Management",
  training: "Training Programs",
  reports: "Reports",
  learning: "Learning Hub",
  competency: "Competency Tracking",
  skills: "Skill Development",
}

export function Breadcrumbs() {
  const pathname = usePathname()

  // Split pathname and filter out empty strings
  const segments = pathname.split("/").filter(Boolean)

  // Don't show breadcrumbs on root dashboard
  if (segments.length === 1 && segments[0] === "dashboard") {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/")
          const label = routeLabels[segment] || segment
          const isLast = index === segments.length - 1

          return (
            <Fragment key={href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
