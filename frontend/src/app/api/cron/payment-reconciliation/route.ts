//import { runPaymentReconciliationJob } from '@/src/lib/cron/paymentReconciliation'
import { runPaymentReconciliationJob } from '@/src/lib/jobs/payment-reconciliation'
import {  NextResponse } from 'next/server'


export async function GET() {
  try {
    console.log('[CRON API] Triggering payment reconciliation job...')
    await runPaymentReconciliationJob()
    console.log('[CRON API] Job completed successfully.')

    return NextResponse.json({ success: true, message: 'Payment reconciliation job executed.' })
  } catch (err) {
    console.error('[CRON API] Job failed:', err)
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 })
  }
}
