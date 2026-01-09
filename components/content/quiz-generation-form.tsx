'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Sparkles, AlertCircle, UserPlus, Users, GraduationCap, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useProducts } from '@/hooks/use-products'
import { useGenerateQuiz } from '@/hooks/use-generated-content'
import type { AudienceType, QuizDifficulty } from '@/lib/types/generated-content'

const formSchema = z.object({
  product_id: z.string().min(1, 'Please select a product'),
  audience_type: z.enum(['new_rep', 'sales_rep', 'trainer', 'certification']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  question_count: z.number().min(5).max(50).optional(),
})

type FormValues = z.infer<typeof formSchema>

const audienceOptions: { value: AudienceType; label: string; description: string; icon: any }[] = [
  { value: 'new_rep', label: 'New Sales Rep', description: 'Onboarding for new representatives', icon: UserPlus },
  { value: 'sales_rep', label: 'Sales Rep', description: 'Standard sales training', icon: Users },
  { value: 'trainer', label: 'Trainer', description: 'L&D managers and trainers', icon: GraduationCap },
  { value: 'certification', label: 'Certification', description: 'Formal product certification', icon: Award },
]

const difficultyOptions: { value: QuizDifficulty; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

interface QuizGenerationFormProps {
  onSuccess?: (generationId: string) => void
}

export function QuizGenerationForm({ onSuccess }: QuizGenerationFormProps) {
  const { data: productsData, isLoading: productsLoading } = useProducts()
  const generateQuizMutation = useGenerateQuiz()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product_id: '',
      audience_type: 'new_rep',
      difficulty: 'intermediate',
      question_count: 10,
    },
  })

  const onSubmit = async (data: FormValues) => {
    try {
      const result = await generateQuizMutation.mutateAsync({
        product_id: data.product_id,
        audience_type: data.audience_type,
        difficulty: data.difficulty,
        question_count: data.question_count,
      })

      if (onSuccess && result.generation_id) {
        onSuccess(result.generation_id)
      }
    } catch (error) {
      // Error toast handled by mutation
      console.error('Failed to generate quiz:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Generate Quiz
        </CardTitle>
        <CardDescription>
          AI-generated quiz from product IFU documentation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {generateQuizMutation.error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {(generateQuizMutation.error as any)?.message || 'Failed to generate quiz. Please try again.'}
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Product Selection */}
            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={productsLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productsData?.map((product: any) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.manufacturer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Quiz generated from product IFU documents
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Audience Type */}
            <FormField
              control={form.control}
              name="audience_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audience Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {audienceOptions.map((option) => {
                        const Icon = option.icon
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-start gap-3">
                              <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {option.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Difficulty (Optional) */}
            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Difficulty (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {difficultyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Question Count (Optional) */}
            <FormField
              control={form.control}
              name="question_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Questions (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={5}
                      max={50}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                    />
                  </FormControl>
                  <FormDescription>
                    Between 5-50 questions (default: 10)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={generateQuizMutation.isPending}
            >
              {generateQuizMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Quiz
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
