import { DashboardHeader } from "@/components/dashboard/header"
import { ProductDetails } from "@/components/products/product-details"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Edit, Printer } from "lucide-react"
import Link from "next/link"

interface ProductPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 pt-6 overflow-hidden">
      <div className="flex-shrink-0 mb-4">
        <DashboardHeader
          title="Product Details"
          description="View and manage product information"
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/products">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Products
                </Link>
              </Button>
            </div>
          }
        />
      </div>

      <div className="flex-1 min-h-0">
        <ProductDetails id={id} />
      </div>
    </div>
  )
}
