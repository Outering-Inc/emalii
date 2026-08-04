
import WaitingClient from "./waitingClient";

export default async function WaitingPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>
}) {
  const { orderId } = await params

  return <WaitingClient orderId={orderId} />
}
