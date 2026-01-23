/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { finalizePayment } from '../orchestrator/payment-orchestrator'

export async function POST(req: Request) {
  try {
    const { orderId, paymentMethod, paymentData } = await req.json()

    await finalizePayment({ orderId, paymentMethod, paymentData })

    return NextResponse.json({
      success: true,
      message: 'Payment verified and order completed',
    })
  } catch (err: any) {
    return NextResponse.json(
        { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
