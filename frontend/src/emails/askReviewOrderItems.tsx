import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

import { formatCurrency } from '../lib/utils/utils'
import { getSetting } from '../lib/actions/admin/setting'

/* ✅ Create a CLEAN email-safe type (NOT mongoose Order) */
type EmailOrder = {
  _id: string
  createdAt: Date
  isPaid: boolean
  paidAt?: Date
  totalPrice: number
  itemsPrice: number
  taxPrice: number
  shippingPrice: number
  user: {
    name: string
    email: string
  }
  shippingAddress: {
    fullName: string
    street: string
    city: string
    postalCode: string
    country: string
    phone: string
    province: string
  }
  items: {
    clientId: string
    name: string
    image: string
    price: number
    quantity: number
    product: string
    slug: string
    category: string
    countInStock: number
  }[]
  paymentMethod: string
  expectedDeliveryDate?: Date
  isDelivered: boolean
}

type OrderInformationProps = {
  order: EmailOrder
}

/* ✅ Preview props — NO casting needed */
AskReviewOrderItemsEmail.PreviewProps = {
  order: {
    _id: '123',
    createdAt: new Date(),
    isPaid: true,
    paidAt: new Date(),
    totalPrice: 100,
    itemsPrice: 100,
    taxPrice: 0,
    shippingPrice: 0,
    user: {
      name: 'John Doe',
      email: 'john.doe@example.com',
    },
    shippingAddress: {
      fullName: 'John Doe',
      street: '123 Main St',
      city: 'New York',
      postalCode: '12345',
      country: 'USA',
      phone: '123-456-7890',
      province: 'New York',
    },
    items: [
      {
        clientId: '123',
        name: 'Product 1',
        image: 'https://via.placeholder.com/150',
        price: 100,
        quantity: 1,
        product: '123',
        slug: 'product-1',
        category: 'Category 1',
        countInStock: 10,
      },
    ],
    paymentMethod: 'PayPal',
    expectedDeliveryDate: new Date(),
    isDelivered: true,
  },
} satisfies OrderInformationProps

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })

export default async function AskReviewOrderItemsEmail({
  order,
}: OrderInformationProps) {
  const { site }: { site: { url: string } } = await getSetting()

  return (
    <Html>
      <Preview>Review Order Items</Preview>
      <Tailwind>
        <Head />
        <Body className="font-sans bg-white">
          <Container className="max-w-xl">
            <Heading>Review Order Items</Heading>

            <Section>
              <Row>
                <Column>
                  <Text className="mb-0 text-gray-500">Order ID</Text>
                  <Text className="mt-0">{order._id}</Text>
                </Column>

                <Column>
                  <Text className="mb-0 text-gray-500">Purchased On</Text>
                  <Text className="mt-0">
                    {dateFormatter.format(order.createdAt)}
                  </Text>
                </Column>

                <Column>
                  <Text className="mb-0 text-gray-500">Price Paid</Text>
                  <Text className="mt-0">
                    {formatCurrency(order.totalPrice)}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Section className="border border-solid border-gray-500 rounded-lg p-4 md:p-6 my-4">
              {order.items.map((item) => (
                <Row key={item.product} className="mt-8">
                  <Column className="w-20">
                    <Link href={`${site.url}/product/${item.slug}`}>
                      <Img
                        width="80"
                        alt={item.name}
                        className="rounded"
                        src={
                          item.image.startsWith('/')
                            ? `${site.url}${item.image}`
                            : item.image
                        }
                      />
                    </Link>
                  </Column>

                  <Column className="align-top">
                    <Link href={`${site.url}/product/${item.slug}`}>
                      <Text className="mx-2 my-0">
                        {item.name} x {item.quantity}
                      </Text>
                    </Link>
                  </Column>

                  <Column align="right" className="align-top">
                    <Button
                      href={`${site.url}/product/${item.slug}#reviews`}
                      className="bg-blue-500 text-white py-2 px-4 rounded"
                    >
                      Review this product
                    </Button>
                  </Column>
                </Row>
              ))}

              {[
                { name: 'Items', price: order.itemsPrice },
                { name: 'Tax', price: order.taxPrice },
                { name: 'Shipping', price: order.shippingPrice },
                { name: 'Total', price: order.totalPrice },
              ].map(({ name, price }) => (
                <Row key={name}>
                  <Column align="right">{name}:</Column>
                  <Column align="right" width={70}>
                    <Text className="m-0">{formatCurrency(price)}</Text>
                  </Column>
                </Row>
              ))}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
