
import SuccessClient from "./successClient";

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>
}) {
  const { orderId } = await params

  return <SuccessClient orderId={orderId} />
}
