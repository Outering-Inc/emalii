// src/lib/orders/order-utils.ts

import { OrderStatus } from './order-status'
import {
  canRetryPayment,
} from './order-status'
import { isRetryExpired } from './order-ttl'
import { Order } from '@/src/lib/db/models/orderModel'

export function canRetryOrder(order: Order) {
  if (!canRetryPayment(order.paymentState as OrderStatus))
    return false

  if (isRetryExpired(order.createdAt)) return false

  return true
}

export function canUseCashOnDelivery(order: Order) {
  return (
    !order.isPaid &&
    order.paymentMethod !== 'CASH' &&
    isRetryExpired(order.createdAt)
  )
}
