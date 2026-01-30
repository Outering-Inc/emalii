// src/app/api/mpesa/status/route.ts
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/src/lib/db/dbConnect'
import MpesaTransaction from '@/src/lib/db/models/mpesaModel'

export async function GET(req: Request) {
  await connectToDatabase()

  const { searchParams } = new URL(req.url)
  const checkoutRequestId = searchParams.get('checkoutRequestId')

  if (!checkoutRequestId) {
    return NextResponse.json(
      { error: 'Missing checkoutRequestId' },
      { status: 400 }
    )
  }

  const tx = await MpesaTransaction.findOne({ checkoutRequestId })

  if (!tx) {
    return NextResponse.json({ status: 'PENDING' })
  }

  return NextResponse.json({
    status: tx.status, // PENDING | SUCCESS | FAILED
    mpesaReceiptNumber: tx.mpesaReceiptNumber,
    amount: tx.amount,
  })
}