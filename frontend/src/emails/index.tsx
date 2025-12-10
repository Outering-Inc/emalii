import { Resend } from 'resend';
import PurchaseReceiptEmail from './purchase-receipt';
import { Order } from '../lib/db/models/orderModel';
import { SENDER_EMAIL, SENDER_NAME } from '@/src/lib/constants';
import AskReviewOrderItemsEmail from './askReviewOrderItems';

// Initialize Resend with API Key
const resend = new Resend(process.env.RESEND_API_KEY as string)

// Function to send purchase receipt
export const sendPurchaseReceipt = async ({ order }: { order: Order }) => {
  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to: (order.user as { email: string }).email,
    subject: 'Order Confirmation',
    react: <PurchaseReceiptEmail order={order} />,
  })
}


// Function to send review request for order items
export const sendAskReviewOrderItems = async ({ order }: { order: Order }) => {
  const oneDayFromNow = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()

  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to: (order.user as { email: string }).email,
    subject: 'Review your order items',
    react: <AskReviewOrderItemsEmail order={order} />,
    scheduledAt: oneDayFromNow,
  })
}