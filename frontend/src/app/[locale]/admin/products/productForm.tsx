'use client'

import { zodResolver } from '@hookform/resolvers/zod'

import { useRouter } from 'next/navigation'
import { useFieldArray, useForm } from 'react-hook-form'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/src/components/ui/form'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { useToast } from '@/src/hooks/client/use-toast'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Product } from '@/src/lib/db/models/productModel'
import { adminCreateProduct, adminUpdateProduct } from '@/src/lib/actions/admin/product'

import { ProductInput  } from '@/src/types'
import { ProductInputSchema, ProductUpdateSchema } from '@/src/lib/validation/validator'
import { toSlug } from '@/src/lib/utils/utils'
import z from 'zod'

import Image from 'next/image'
import { UploadButton } from '@/src/lib/uploadthing'
import { Trash } from 'lucide-react'
import { useEffect } from 'react'


const productDefaultValues: ProductInput =
  process.env.NODE_ENV === 'development'
    ? {
        name: 'Sample Product',
        slug: 'sample-product',
        category: 'Sample Category',
        subcategory: 'Sample SubCategory',
        tags: ['new-arrival', 'premium'],
        images: ['/images/p11-1.jpg'],
        brand: 'Sample Brand',
        description: 'This is a sample description of the product.',
        keywords: ['Best Product', 'Premium Quality', 'High Performance'],
        price: 99.99,
        listPrice: 0,
        countInStock: 15,
        numReviews: 0,
        avgRating: 0,
        numSales: 0,
        isPublished: false,
        sizes: [],
        colors: [],
        ratingDistribution: [],
        reviews: [],
         // ✅ Add these two
        variants: [], 
      }
    : {
        name: '',
        slug: '',
        category: '',
        subcategory: '',
        tags: [],
        images: [],
        brand: '',
        description: '',
        keywords: [],
        price: 0,
        listPrice: 0,
        countInStock: 0,
        numReviews: 0,
        avgRating: 0,
        numSales: 0,
        isPublished: false,
        sizes: [],
        colors: [],
        ratingDistribution: [],
        reviews: [],
          // ✅ Add these two
        variants: [],

      }

const ProductForm = ({
  type,
  product,
  productId,
}: {
  type: 'Create' | 'Update'
  product?: Product 
  productId?: string
}) => {
  const router = useRouter()
  const { toast } = useToast() 
   
  const schema = type === 'Update' ? ProductUpdateSchema : ProductInputSchema;

 const form = useForm<
    z.input<typeof schema>,
    unknown,
    z.output<typeof schema>
  >({
    resolver: zodResolver(schema),
    defaultValues: type === 'Update' && product ? product : productDefaultValues,
  });
  
  const images = form.watch('images')
  const variants = form.watch('variants')
   
  /* ----------------------------- VARIANT ARRAY ----------------------------- */

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  })
   
 
   // ------------------- REAL-TIME STOCK UPDATE -------------------
  useEffect(() => {
    const totalStock = variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? 0
    form.setValue('countInStock', totalStock)
  }, [variants, form])
  async function onSubmit(values: ProductInput) {
  // Auto-generate slugs
  values.slug = toSlug(values.name)
  values.categorySlug = toSlug(values.category)
  values.tagsSlug = values.tags.map(toSlug)

  // ✅ Guard variants
  const variants = values.variants ?? []

  // ❌ Prevent duplicate variants
  const keys = variants.map(v => `${v.color}-${v.size}`)
  if (new Set(keys).size !== keys.length) {
    toast({
      variant: 'destructive',
      description: 'Duplicate color/size variants detected',
    })
    return
  }

  // ✅ Derive colors & sizes
  values.colors = [...new Set(variants.map(v => v.color))]
  values.sizes = [...new Set(variants.map(v => v.size))]

  // ✅ Derive total stock
  values.countInStock = variants.reduce((sum, v) => sum + v.stock, 0)

  if (type === 'Create') {
    const res = await adminCreateProduct(values)
    if (!res.success) {
      toast({
        variant: 'destructive',
        description: res.message,
      })
    } else {
      toast({ description: res.message })
      router.push(`/admin/products`)
    }
  }

  if (type === 'Update') {
    if (!productId) {
      router.push(`/admin/products`)
      return
    }
    const res = await adminUpdateProduct({ ...values, _id: productId })
    if (!res.success) {
      toast({
        variant: 'destructive',
        description: res.message,
      })
    } else {
      router.push(`/admin/products`)
    }
  }
}

  

   return (
    <Form {...form}>
      <form
        method='post'
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-8'
      >
        <div className='flex flex-col gap-5 md:flex-row'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder='Enter product name' {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='slug'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Slug</FormLabel>

                <FormControl>
                  <div className='relative'>
                    <Input
                      placeholder='Enter product slug'
                      className='pl-8'
                      {...field}
                    />
                    <button
                      type='button'
                      onClick={() => {
                        form.setValue('slug', toSlug(form.getValues('name')))
                      }}
                      className='absolute right-2 top-2.5'
                    >
                      Generate
                    </button>
                  </div>
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className='flex flex-col gap-5 md:flex-row'>
          <FormField
            control={form.control}
            name='brand'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Brand</FormLabel>
                <FormControl>
                  <Input placeholder='Enter Brand name' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
            <FormField
            control={form.control}
            name='category'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder='Enter Category' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>
         <div className='flex flex-col gap-5 md:flex-row'>
           <FormField
            control={form.control}
            name='subcategory'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Sub Category</FormLabel>
                <FormControl>
                  <Input placeholder='Enter Sub category' {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='subsubcategory'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Sub-SubCategory</FormLabel>
                <FormControl>
                  <Input placeholder='Enter Sub-subcategory' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
         
        </div>
       <div className='flex flex-col gap-5 md:flex-row'>
         <FormField
            control={form.control}
            name="keywords"
            render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Keywords</FormLabel>
            <FormControl>
            <Input
              placeholder="Best Product, Premium Quality, High Performance,Best Lenovo Laptops"
              value={field.value?.join(', ') ?? ''}
              onChange={(e) => {
              const value = e.target.value
              field.onChange(
              value
                .split(',')
                .map(keyword => keyword.trim())
                .filter(Boolean)
              )
              }}
            />
              </FormControl>
              <FormMessage />
            </FormItem>
            )}
          />
         <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Tags</FormLabel>
            <FormControl>
            <Input
              placeholder="new-arrival, premium, best-seller,approvals, power-discount, fast-moving"
              value={field.value?.join(', ') ?? ''}
              onChange={(e) => {
              const value = e.target.value
              field.onChange(
              value
                .split(',')
                .map(tag => tag.trim())
                .filter(Boolean)
              )
              }}
            />
              </FormControl>
              <FormMessage />
            </FormItem>
            )}
          />
         
        </div>
        <div className='flex flex-col gap-5 md:flex-row'>
          <FormField
            control={form.control}
            name='listPrice'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>List Price</FormLabel>
                <FormControl>
                  <Input placeholder='Enter product list price' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='price'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Net Price</FormLabel>
                <FormControl>
                  <Input placeholder='Enter product price' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='countInStock'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Count In Stock</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    placeholder='Enter product count in stock'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex flex-col gap-5 md:flex-row'>
                    {/* MAIN IMAGES */}
        <Card>
          <CardContent className="space-y-2">
            <FormLabel>Product Images</FormLabel>
            <div className="flex gap-2 flex-wrap">
              {images.map((img) => (
                <Card key={img} className="relative">
                  <Image src={img} alt="" width={100} height={100} />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1"
                    type="button"
                    onClick={() =>
                      form.setValue('images', images.filter((i) => i !== img))
                    }
                  >
                    <Trash size={14} />
                  </Button>
                </Card>
              ))}
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) =>
                  form.setValue('images', [...images, res[0].url])
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* ---------------- VARIANTS ---------------- */}
         {/* ---------------- VARIANTS ---------------- */}
<Card>
  <CardContent className="space-y-4">
    <div className="flex justify-between items-center">
      <FormLabel>Variants (Color & Size)</FormLabel>
      <Button
        type="button"
        onClick={() =>
          append({ color: '', size: '', stock: 0, images: [] })
        }
      >
        + Add Variant
      </Button>
    </div>

    {fields.map((field, index) => {
      const vImages = form.watch(`variants.${index}.images`) || []
      const vColor = form.watch(`variants.${index}.color`) || ''

      // Predefined filler colors
      const fillerColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ffa500']

      return (
        <Card key={field.id} className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            {/* COLOR */}
            <FormField
              control={form.control}
              name={`variants.${index}.color`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl className="flex items-center gap-2">
                    {/* Manual input */}
                    <input
                      type="color"
                      value={field.value || '#000000'}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-10 h-10 rounded-full border"
                    />

                    {/* Filler colors */}
                    {fillerColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border ${
                          vColor === color ? 'ring-2 ring-blue-500' : ''
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => field.onChange(color)}
                      />
                    ))}
                  </FormControl>
                </FormItem>
              )}
            />

            {/* SIZE */}
            <FormField
              control={form.control}
              name={`variants.${index}.size`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size</FormLabel>
                  <FormControl>
                    <Input placeholder="S, M, L" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* STOCK */}
          <FormField
            control={form.control}
            name={`variants.${index}.stock`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Variant Images */}
          <div className="flex gap-2 flex-wrap">
            {vImages.map((img: string) => (
              <Card key={img} className="relative">
                <Image src={img} alt="" width={80} height={80} />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1"
                  type="button"
                  onClick={() =>
                    form.setValue(
                      `variants.${index}.images`,
                      vImages.filter((i) => i !== img)
                    )
                  }
                >
                  <Trash size={12} />
                </Button>
              </Card>
            ))}
            <UploadButton
              endpoint="imageUploader"
              onClientUploadComplete={(res) => {
                form.setValue(
                  `variants.${index}.images`,
                  [...vImages, res[0].url]
                )
              }}
            />
          </div>

          {/* REMOVE VARIANT */}
          <Button
            variant="destructive"
            type="button"
            onClick={() => remove(index)}
          >
            Remove Variant
          </Button>
        </Card>
      )
    })}
  </CardContent>
</Card>
         
        </div>

        <div>
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Tell us a little bit about yourself'
                    className='resize-none'
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  You can <span>@mention</span> other users and organizations to
                  link to them.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div>
          <FormField
            control={form.control}
            name='isPublished'
            render={({ field }) => (
              <FormItem className='space-x-2 items-center'>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Is Published?</FormLabel>
              </FormItem>
            )}
          />
        </div>
        <div>
          <Button
            type='submit'
            size='lg'
            disabled={form.formState.isSubmitting}
            className='button col-span-2 w-full'
          >
            {form.formState.isSubmitting ? 'Submitting...' : `${type} Product `}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default ProductForm