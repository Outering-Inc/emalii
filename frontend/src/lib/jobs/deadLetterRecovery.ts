import OrderModel from '@/src/lib/db/models/orderModel'
import { PaymentState } from '@/src/lib/payments/state-machine/paymentState'

export async function recoverDeadPayments() {
  const dead = await OrderModel.find({
    paymentState: PaymentState.PROCESSING,
    updatedAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) },
  })

  for (const order of dead) {
    order.paymentState = PaymentState.FAILED
    await order.save()

    // optional: notify user
    // sendEmail(order.user, 'Payment failed, retry available')
  }
}
