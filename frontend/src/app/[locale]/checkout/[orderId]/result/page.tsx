import OrderResultClient from './orderResultClient'

export default async function OrderResultPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>
}) {
  const { orderId } = await params

  return <OrderResultClient orderId={orderId} />
}
