import {
  Body,
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

import { formatCurrency } from '@/src/lib/utils/utils'
import { getSetting } from '../lib/actions/admin/setting'
import { Order } from '../lib/db/models/orderModel'

type OrderInformationProps = {
  order: Order
}

const dateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/* ================= PREVIEW (DEV ONLY) ================= */
PurchaseReceiptEmail.PreviewProps = {
  order: {
    _id: '1234567890',
    createdAt: new Date(),
    updatedAt: new Date(),

    paymentMethod: 'PAYPAL',
    paymentState: 'CAPTURED',

    isPaid: true,
    paidAt: new Date(),

    paymentReference: {
      provider: 'PAYPAL',
      transactionId: 'PAYPAL_TX_987654',
      status: 'COMPLETED',
    },

    itemsPrice: 100,
    taxPrice: 0,
    shippingPrice: 0,
    totalPrice: 100,

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
      province: 'New York',
      phone: '123-456-7890',
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
        variantId: 'v1',
      },
    ],

    expectedDeliveryDate: new Date(),
    isDelivered: false,
  } as unknown as Order,
} satisfies OrderInformationProps

/* ================= COMPONENT ================= */
export default async function PurchaseReceiptEmail({
  order,
}: OrderInformationProps) {
  const { site } = await getSetting()

  return (
    <Html>
      <Preview>Your order receipt</Preview>
      <Tailwind>
        <Head />
        <Body className="font-sans bg-white">
          <Container className="max-w-xl">
            <Heading>Purchase Receipt</Heading>

            {/* ================= ORDER META ================= */}
            <Section className="mb-4">
              <Row>
                <Column>
                  <Text className="text-gray-500 m-0">Order ID</Text>
                  <Text className="m-0">{order._id.toString()}</Text>
                </Column>

                <Column>
                  <Text className="text-gray-500 m-0">Purchased On</Text>
                  <Text className="m-0">
                    {dateFormatter.format(order.createdAt)}
                  </Text>
                </Column>

                <Column>
                  <Text className="text-gray-500 m-0">Total Paid</Text>
                  <Text className="m-0">
                    {formatCurrency(order.totalPrice)}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* ================= PAYMENT INFO ================= */}
            <Section className="border border-gray-300 rounded-lg p-4 mb-4">
              <Heading as="h3">Payment Details</Heading>

              <Row>
                <Column>
                  <Text className="m-0 text-gray-500">Method</Text>
                </Column>
                <Column align="right">
                  <Text className="m-0 font-semibold">
                    {order.paymentMethod}
                  </Text>
                </Column>
              </Row>

              {order.paymentReference && (
                <>
                  <Row>
                    <Column>
                      <Text className="m-0 text-gray-500">Transaction ID</Text>
                    </Column>
                    <Column align="right">
                      <Text className="m-0">
                        {order.paymentReference.transactionId}
                      </Text>
                    </Column>
                  </Row>

                  {order.paymentReference.status && (
                    <Row>
                      <Column>
                        <Text className="m-0 text-gray-500">Status</Text>
                      </Column>
                      <Column align="right">
                        <Text className="m-0">
                          {order.paymentReference.status}
                        </Text>
                      </Column>
                    </Row>
                  )}
                </>
              )}
            </Section>

            {/* ================= ITEMS ================= */}
            <Section className="border border-gray-300 rounded-lg p-4">
              {order.items.map((item) => (
                <Row key={item.clientId} className="mt-6">
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
                    <Text className="m-0">
                      {item.name} × {item.quantity}
                    </Text>
                  </Column>

                  <Column align="right">
                    <Text className="m-0">
                      {formatCurrency(item.price)}
                    </Text>
                  </Column>
                </Row>
              ))}

              {/* ================= TOTALS ================= */}
              {[
                { label: 'Items', value: order.itemsPrice },
                { label: 'Tax', value: order.taxPrice },
                { label: 'Shipping', value: order.shippingPrice },
                { label: 'Total', value: order.totalPrice },
              ].map(({ label, value }) => (
                <Row key={label} className="py-1">
                  <Column align="right">{label}:</Column>
                  <Column align="right" width={80}>
                    <Text className="m-0">
                      {formatCurrency(value)}
                    </Text>
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
