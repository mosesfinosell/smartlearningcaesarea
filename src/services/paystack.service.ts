import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

interface PaystackInitializePayload {
  email: string;
  amount: number; // in kobo (multiply by 100)
  reference: string;
  callback_url?: string;
  metadata?: any;
  channels?: string[];
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
    customer: {
      id: number;
      customer_code: string;
      email: string;
    };
  };
}

export class PaystackService {
  private static headers = {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };

  /**
   * Initialize a payment transaction
   */
  static async initializeTransaction(payload: PaystackInitializePayload) {
    try {
      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/transaction/initialize`,
        payload,
        { headers: this.headers }
      );

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('Paystack Initialize Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to initialize payment',
      };
    }
  }

  /**
   * Verify a payment transaction
   */
  static async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    try {
      const response = await axios.get(
        `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        { headers: this.headers }
      );

      return response.data;
    } catch (error: any) {
      console.error('Paystack Verify Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to verify payment');
    }
  }

  /**
   * List all transactions
   */
  static async listTransactions(params?: {
    perPage?: number;
    page?: number;
    status?: 'success' | 'failed' | 'abandoned';
    from?: string;
    to?: string;
  }) {
    try {
      const queryString = new URLSearchParams(params as any).toString();
      const response = await axios.get(
        `${PAYSTACK_BASE_URL}/transaction?${queryString}`,
        { headers: this.headers }
      );

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('Paystack List Transactions Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch transactions',
      };
    }
  }

  /**
   * Create a customer
   */
  static async createCustomer(email: string, firstName: string, lastName: string, phone?: string) {
    try {
      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/customer`,
        {
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
        },
        { headers: this.headers }
      );

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('Paystack Create Customer Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create customer',
      };
    }
  }

  /**
   * Generate payment reference
   */
  static generateReference(): string {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000);
    return `CS_${timestamp}_${randomNum}`;
  }

  /**
   * Convert amount to kobo (Paystack uses kobo for NGN)
   */
  static toKobo(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Convert kobo to naira
   */
  static fromKobo(kobo: number): number {
    return kobo / 100;
  }

  /**
   * Process refund
   */
  static async processRefund(reference: string, amount?: number, merchantNote?: string) {
    try {
      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/refund`,
        {
          transaction: reference,
          amount: amount ? this.toKobo(amount) : undefined,
          merchant_note: merchantNote,
        },
        { headers: this.headers }
      );

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('Paystack Refund Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to process refund',
      };
    }
  }

  /**
   * Fetch transaction
   */
  static async fetchTransaction(id: number) {
    try {
      const response = await axios.get(
        `${PAYSTACK_BASE_URL}/transaction/${id}`,
        { headers: this.headers }
      );

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('Paystack Fetch Transaction Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch transaction',
      };
    }
  }

  /**
   * Calculate platform fee (optional - if you take a commission)
   */
  static calculatePlatformFee(amount: number, feePercentage: number = 2.5): number {
    return Math.round(amount * (feePercentage / 100));
  }
}

export default PaystackService;
