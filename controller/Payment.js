import axios from "axios";
import moment from "moment";
import MpesaCredentials from './MpesaCredentials.js';
import OffersController from "./OffersController.js";

class Payment {
    constructor() {
        this.axios = axios;
        this.moment = moment;
    }

    async getAccessToken() {
        try {
            const credentials = await MpesaCredentials.getCredentials();
            console.log('🔑 M-Pesa Credentials:', {
                hasCredentials: !!credentials,
                consumerKey: credentials ? credentials.consumer_key.substring(0, 5) + '...' : 'N/A',
                shortCode: credentials?.short_code || 'N/A'
            });

            if (!credentials) {
                throw new Error('M-Pesa credentials not found');
            }

            const auth = Buffer.from(`${credentials.consumer_key}:${credentials.consumer_secret}`).toString('base64');
            const environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
            const isSandbox = environment === 'sandbox';
            
            const url = isSandbox
                ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
                : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

            console.log(`🔑 Requesting access token from: ${isSandbox ? 'Sandbox' : 'Live'} environment`);
            
            const response = await this.axios.get(url, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Cache-Control': 'no-cache'
                },
                timeout: 10000 // 10 seconds timeout
            });

            if (!response.data || !response.data.access_token) {
                console.error('❌ Invalid access token response:', response.data);
                throw new Error('Invalid access token response from M-Pesa');
            }

            console.log('✅ Successfully obtained access token');
            return response.data.access_token;
            
        } catch (error) {
            console.error('❌ Error in getAccessToken:', {
                message: error.message,
                response: error.response?.data || 'No response data',
                status: error.response?.status,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: {
                        'Authorization': error.config?.headers?.Authorization ? 'Basic [REDACTED]' : 'None'
                    }
                }
            });
            throw new Error(`Failed to get access token: ${error.message}`);
        }
    }

    async stkPush(phone, packageId) {
        try {
            console.log('🔵 STK Push initiated for package ID:', packageId, 'phone:', phone);
            
            // Get package details from database
            const offer = await OffersController.getOfferById(packageId);
            if (!offer) {
                console.error('❌ Package not found with ID:', packageId);
                throw new Error('Package not found');
            }

            const amount = parseFloat(offer.price);
            const credentials = await MpesaCredentials.getCredentials();

            if (!credentials) {
                throw new Error('M-Pesa credentials not found');
            }

            const access_token = await this.getAccessToken();
            const timestamp = this.moment().format('YYYYMMDDHHmmss');
            const password = Buffer.from(
                `${credentials.short_code}${credentials.pass_key}${timestamp}`
            ).toString('base64');

            const environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
            const stkUrl = environment === 'sandbox'
                ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
                : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

            // Format phone number to M-Pesa format (2547...)
            let formattedPhone = phone.toString().trim();
            
            // Remove any non-digit characters
            formattedPhone = formattedPhone.replace(/\D/g, '');
            
            // Convert to 254 format if it starts with 0 or 7
            if (formattedPhone.startsWith('0')) {
                formattedPhone = '254' + formattedPhone.substring(1);
            } else if (formattedPhone.startsWith('7') && formattedPhone.length === 9) {
                formattedPhone = '254' + formattedPhone;
            } else if (formattedPhone.startsWith('254') && formattedPhone.length !== 12) {
                throw new Error('Invalid phone number format');
            }

            console.log('🔵 Sending STK push with details:', {
                amount,
                formattedPhone,
                shortCode: credentials.short_code,
                callbackUrl: MpesaCredentials.getCallbackUrl()
            });

            const requestPayload = {
                BusinessShortCode: credentials.short_code,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: Math.round(amount),
                PartyA: formattedPhone,
                PartyB: credentials.short_code,
                PhoneNumber: formattedPhone,
                CallBackURL: MpesaCredentials.getCallbackUrl(),
                AccountReference: `PKG-${packageId}`,
                TransactionDesc: `Payment for package ${offer.name}`
            };

            console.log('🔵 M-Pesa Request Payload:', JSON.stringify(requestPayload, null, 2));

            console.log('🔵 Sending request to M-Pesa API:', stkUrl);
            console.log('🔵 Using access token:', access_token ? 'Token received' : 'No token');
            
            const response = await this.axios.post(stkUrl, requestPayload, {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                timeout: 30000 // 30 seconds timeout
            });

            return {
                success: true,
                data: response.data,
                package: {
                    id: offer.id,
                    name: offer.name,
                    amount: amount
                }
            };
        } catch (error) {
            console.error('STK Push Error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.errorMessage || 'Failed to initiate STK push');
        }
    }
}

export default new Payment();