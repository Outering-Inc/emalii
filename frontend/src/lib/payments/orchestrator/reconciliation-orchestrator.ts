//import { PaymentMethod, PaymentResult, ReconciliationResult, ReconciliationStatus } from './type'
import { verifyPayPalPayment } from '../paypal/verify-payment'
import { verifyStripePayment } from '../stripe/payment-verification'
import { verifyMpesaPayment } from '../mpesa/payment-verification'
import { PaymentMethod, PaymentResult, ReconciliationResult, ReconciliationStatus } from '../reconciliation/type'




export async function reconcileOrderPayment(
  paymentMethod: PaymentMethod,
  paymentData: PaymentResult,
  expectedAmount: number
): Promise<ReconciliationResult> {
  let result: ReconciliationResult = {
    status: ReconciliationStatus.FAILED,
    raw: paymentData,
    paidAmount: 0,
    providerReference: paymentData.id ?? 'N/A',
  }

  switch (paymentMethod) {
      case PaymentMethod.Mpesa:
      const mpesaVerified = await verifyMpesaPayment(paymentData.raw)
      result = {
        status: mpesaVerified ? ReconciliationStatus.MATCHED : ReconciliationStatus.FAILED,
        paidAmount: Number(paymentData.amount ?? 0),
        providerReference: paymentData.id,
        raw: paymentData.raw,
        failureReason: mpesaVerified ? undefined : 'Mpesa verification failed',
      }
      break

    case PaymentMethod.PayPal:
      const paypalVerified = await verifyPayPalPayment(paymentData.raw)
      result = {
        status: paypalVerified ? ReconciliationStatus.MATCHED : ReconciliationStatus.FAILED,
        paidAmount: Number(paymentData.amount ?? 0),
        providerReference: paymentData.id,
        raw: paymentData.raw,
        failureReason: paypalVerified ? undefined : 'PayPal verification failed',
      }
      break

    case PaymentMethod.Stripe:
      const stripeVerified = await verifyStripePayment(paymentData.raw)
      result = {
        status: stripeVerified ? ReconciliationStatus.MATCHED : ReconciliationStatus.FAILED,
        paidAmount: Number(paymentData.amount ?? 0),
        providerReference: paymentData.id,
        raw: paymentData.raw,
        failureReason: stripeVerified ? undefined : 'Stripe verification failed',
      }
      break

    case PaymentMethod.CashOnDelivery:
      result = {
        status: ReconciliationStatus.MATCHED,
        paidAmount: expectedAmount,
        providerReference: 'COD',
        raw: paymentData.raw,
      }
      break

    default:
      throw new Error(`Unsupported payment method: ${paymentMethod}`)
  }

  return result
}
