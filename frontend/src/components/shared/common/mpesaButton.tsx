'use client'

export function MpesaPayButton({
  loading,
  priceInCents,
}: {
  loading: boolean
  priceInCents: number
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-green-600 text-white rounded p-2 disabled:opacity-50"
    >
      {loading
        ? 'Processing…'
        : `Pay KES ${priceInCents / 100}`}
    </button>
  )
}