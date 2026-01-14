import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function TenantNotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-center">Organisation Not Found</CardTitle>
          <CardDescription className="text-center">
            The organisation you're trying to access doesn't exist or has been deactivated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            Please check your URL and try again. If you believe this is an error, contact your administrator.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="https://landy.ai">Go to Homepage</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="mailto:support@landy.ai">Contact Support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
