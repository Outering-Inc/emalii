//import RetryPaymentClient from './RetryPaymentClient'

import RetryPaymentClient from "./retryPaymentClient";

export default async function RetryPaymentPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>
}) {
  const { orderId } = await params

  return <RetryPaymentClient orderId={orderId} />
}
