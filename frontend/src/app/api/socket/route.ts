/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { getSocketServer } from '@/src/lib/socket/server'

export async function GET(req: any) {
  getSocketServer(req.socket?.server)
  return NextResponse.json({ ok: true })
}