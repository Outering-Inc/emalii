// ------------------ Mpesa Frontend Transaction ------------------
export type MpesaTransaction = {
  checkoutRequestId: string
  merchantRequestId?: string
  phone: string
  amount: number
  orderId: string

  status?: 'PENDING' | 'SUCCESS' | 'FAILED'

  createdAt?: string
}


// --- Mpesa Callback Types ---
export interface RawMpesaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: CallbackMetadataItem[];
      };
    };
  };
}

// Normalized callback data after validationand extraction
export interface MpesaCallback {
  checkoutRequestID: string;
  mpesaReceiptNumber: string;
  amount: number;
  phone: string;
  transactionDate: string;
  resultCode: number;
  resultDesc: string;
  merchantRequestId: string;
  user?: string;
  orderId?: string;
}

// ------------------ M-Pesa Online Status ------------------
export type CallbackMetadataItem = {
  Name: string;
  Value: string | number;
};

// ------------------ Pending Transaction (for frontend state) ------------------
export type MpesaPendingTx = Partial<MpesaTransaction> & {
  checkoutRequestId: string
  orderId: string
}
