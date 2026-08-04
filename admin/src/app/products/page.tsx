import { toSlug } from "@/lib/utils";
import { Product, columns } from "./columns";
import { DataTable } from "./data-table";

const getData = async (): Promise<Product[]> => {
  return  [
      {
      name: 'Nike Mens Slim-fit Long-Sleeve T-Shirt',
      slug: toSlug('Nike Mens Slim-fit Long-Sleeve T-Shirt'),
      category: 'T-Shirts',
      images: ['/images/p11-1.jpg', '/images/p11-2.jpg'],
      tags: ['new-arrival'],
      isPublished: true,
      price: 21.8,
      listPrice: 0,
      brand: 'Nike',
      avgRating: 4.71,
      numReviews: 7,
      ratingDistribution: [
        { rating: 1, count: 0 },
        { rating: 2, count: 0 },
        { rating: 3, count: 0 },
        { rating: 4, count: 2 },
        { rating: 5, count: 5 },
      ],
      numSales: 9,
      countInStock: 11,
      description:
        'Made with chemicals safer for human health and the environment',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Green', 'Red', 'Black'],
  
      reviews: [],
      variantImages: {},
      variants: [],
    },
    {
      name: 'Jerzees Long-Sleeve Heavyweight Blend T-Shirt',
      slug: toSlug('Jerzees Long-Sleeve Heavyweight Blend T-Shirt'),
      category: 'T-Shirts',
      images: [
        '/images/p12-1.jpg',
        '/images/p12-2.jpg',
        '/images/p12-3.jpg',
        '/images/p12-4.jpg',
      ],
      tags: ['featured'],
      isPublished: true,
      price: 23.78,
      listPrice: 0,
      brand: 'Jerzees',
      avgRating: 4.2,
      numReviews: 10,
      ratingDistribution: [
        { rating: 1, count: 1 },
        { rating: 2, count: 0 },
        { rating: 3, count: 0 },
        { rating: 4, count: 4 },
        { rating: 5, count: 5 },
      ],
      numSales: 29,
      countInStock: 12,
      description:
        'Made with sustainably sourced USA grown cotton; Shoulder-to-shoulder tape; double-needle coverstitched front neck; Set-in sleeves; Rib cuffs with concealed seams; Seamless body for a wide printing area',
  
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Yellow', 'Red', 'Black'],
  
      reviews: [],
      variantImages: {},
      variants: [],
    },
    {
      name: "Jerzees Men's Long-Sleeve T-Shirt",
      slug: toSlug('Jerzees Men Long-Sleeve T-Shirt'),
      category: 'T-Shirts',
      brand: 'Jerzees',
      images: ['/images/p13-1.jpg', '/images/p13-2.jpg'],
      tags: ['best-seller'],
      isPublished: true,
      price: 13.86,
      listPrice: 16.03,
      avgRating: 4,
      numReviews: 12,
      ratingDistribution: [
        { rating: 1, count: 1 },
        { rating: 2, count: 0 },
        { rating: 3, count: 2 },
        { rating: 4, count: 4 },
        { rating: 5, count: 5 },
      ],
      numSales: 55,
      countInStock: 13,
      description:
        'The Jerzees long sleeve t-shirt is made with dri-power technology that wicks away moisture to keep you cool and dry throughout your day. We also included a rib collar and cuffs for added durability, and a lay-flat collar for comfort. If you are looking for a versatile shirt that you can wear throughout the transitioning seasons, then look no further.',
      sizes: ['XL', 'XXL'],
      colors: ['Green', 'White'],
  
      reviews: [],
      variantImages: {},
      variants: [],
    },
    {
      name: 'Decrum Mens Plain Long Sleeve T-Shirt - Comfortable Soft Fashion V Neck Full Sleeves Jersey Shirts',
      slug: toSlug(
        'Decrum Mens Plain Long Sleeve T-Shirt - Comfortable Soft Fashion V Neck Full Sleeves Jersey Shirts'
      ),
      category: 'T-Shirts',
      brand: 'Jerzees',
      images: ['/images/p14-1.jpg', '/images/p14-2.jpg'],
      tags: ['todays-deal'],
      isPublished: true,
      price: 26.95,
      listPrice: 46.03,
      avgRating: 3.85,
      numReviews: 14,
      ratingDistribution: [
        { rating: 1, count: 0 },
        { rating: 2, count: 2 },
        { rating: 3, count: 3 },
        { rating: 4, count: 4 },
        { rating: 5, count: 5 },
      ],
      numSales: 54,
      countInStock: 14,
      description:
        'Elevate your outfit with this soft long sleeve t shirt men. This full sleeves tee is the ultimate upgrade from your regular cotton t-shirt. ',
      sizes: ['XL', 'XXL'],
      colors: ['Yellow', 'White'],
  
      reviews: [],
      variantImages: {},
      variants: [],
    },
    
  ];
};

const PaymentsPage = async () => {
  const data = await getData();
  return (
    <div className="">
      <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
        <h1 className="font-semibold">All Products</h1>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default PaymentsPage;