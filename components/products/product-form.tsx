'use client'

import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { Package, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormMessage, FormDescription } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { useCreateProductWithFiles } from '@/hooks/use-products'
import { FileUploadSection, type FileWithMetadata } from './file-upload-section'

// Zod schema
const formSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  model_number: z.string().min(1, 'Model number is required'),
  category: z.enum(['cardiovascular', 'orthopedic', 'neurology', 'surgical', 'diagnostic', 'other']),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function ProductForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { createWithFiles, isPending } = useCreateProductWithFiles()

  const [files, setFiles] = useState<FileWithMetadata[]>([])
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({})
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      manufacturer: '',
      model_number: '',
      category: 'diagnostic',
      description: '',
    },
  })

  // Extract product image from files
  const productImage = useMemo(() => {
    return files.find(f => f.fileType === 'product_image')
  }, [files])

  // Create object URL for image preview and clean up on unmount
  useEffect(() => {
    if (productImage?.file) {
      const url = URL.createObjectURL(productImage.file)
      setImagePreviewUrl(url)

      return () => {
        URL.revokeObjectURL(url)
        setImagePreviewUrl(null)
      }
    } else {
      setImagePreviewUrl(null)
    }
  }, [productImage])

  const removeProductImage = () => {
    setFiles(prevFiles => prevFiles.filter(f => f.fileType !== 'product_image'))
  }

  const onSubmit = async (data: FormValues) => {
    try {
      console.log('ProductForm: Submitting product creation...')
      const product = await createWithFiles(
        data,
        files.map(f => ({ file: f.file, fileType: f.fileType })),
        (fileName, percent) => {
          setFileProgress(prev => ({ ...prev, [fileName]: percent }))

          // Update file in list with progress
          setFiles(prevFiles =>
            prevFiles.map(f =>
              f.file.name === fileName
                ? { ...f, uploadProgress: percent }
                : f
            )
          )
        }
      )

      console.log('ProductForm: Product created:', product)

      // Extract the product ID (handle multiple naming conventions: id, productID, ProductID)
      const productId = (product as any).id || product.productID || (product as any).ProductID
      const productName = product.name || (product as any).Name || 'Product'

      toast({
        title: 'Product Created Successfully!',
        description: `${productName} has been created. Files are being processed.`,
      })

      // Navigate to product detail page using the UUID
      if (productId) {
        console.log('ProductForm: Navigating to product detail:', productId)
        router.push(`/dashboard/products/${productId}`)
      } else {
        console.warn('ProductForm: No product ID returned, navigating to list')
        router.push(`/dashboard/products`)
      }
    } catch (error) {
      console.error('ProductForm: Failed to create product:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create product',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>
              Enter the basic information for the medical device product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <Label>Product Name*</Label>
                  <FormControl>
                    <Input
                      placeholder="e.g., UltraSound Pro 3000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem>
                  <Label>Manufacturer*</Label>
                  <FormControl>
                    <Input
                      placeholder="e.g., Siemens Healthineers"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model_number"
              render={({ field }) => (
                <FormItem>
                  <Label>Model Number*</Label>
                  <FormControl>
                    <Input
                      placeholder="e.g., USP-3000-2024"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <Label>Category*</Label>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cardiovascular">Cardiovascular</SelectItem>
                        <SelectItem value="orthopedic">Orthopedic</SelectItem>
                        <SelectItem value="neurology">Neurology</SelectItem>
                        <SelectItem value="surgical">Surgical</SelectItem>
                        <SelectItem value="diagnostic">Diagnostic</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <Label>Description</Label>
                  <FormControl>
                    <Textarea
                      placeholder="Product description, key features, and clinical applications..."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Provide detailed information about the product
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Product Image Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Product Image</CardTitle>
            <CardDescription>
              Preview of the product image (optional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {/* Image Preview */}
              <div className="flex-shrink-0 w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/20">
                {imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-16 w-16 text-muted-foreground/40" />
                )}
              </div>

              {/* Image Info */}
              <div className="flex-1 space-y-2">
                {productImage ? (
                  <>
                    <p className="text-sm font-medium">{productImage.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(productImage.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeProductImage}
                      disabled={isPending}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove Image
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No product image selected. Add an image file in the section below.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <FileUploadSection
          files={files}
          onFilesChange={setFiles}
          isUploading={isPending}
        />

        <Card>
          <CardFooter className="pt-6">
            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
              size="lg"
            >
              {isPending ? 'Creating Product...' : 'Create Product'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
