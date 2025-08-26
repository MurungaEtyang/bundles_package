import axios from 'axios';
import { Buffer } from 'buffer';
import crypto from 'crypto';

// Your credentials
const credentials = {
    consumerKey: 'nL4bcoTeQKXBFxNiahFGnwyNGGZoGjj9R1GSB2GTjYLwd1EW',
    consumerSecret: '4WtXa5A2qaqd9n3GLsdvnBfpUYZSe20sh5FiNPxN0GA20wv2nHCgchylpceIiAwP',
    shortCode: 3547517,
    passKey: '6dcd1e2443385b919af608ff0d8a8efb7b18332fdfb67ce65d9905cce05d8039'
};

// Test parameters
const testParams = {
    amount: 1,
    phone: '254717325657',
    callbackUrl: 'https://d838da136294.ngrok-free.app/api/mpesa/callback'
};

async function getAccessToken() {
    try {
        const auth = Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString('base64');
        const url = 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
        
        console.log('🔑 Getting access token...');
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.data.access_token) {
            throw new Error('No access token received');
        }

        console.log('✅ Access token received');
        return response.data.access_token;
    } catch (error) {
        console.error('❌ Error getting access token:', error.response?.data || error.message);
        throw error;
    }
}

async function stkPush() {
    try {
        const accessToken = await getAccessToken();
        
        // Generate timestamp (YYYYMMDDHHmmss)
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        
        // Generate password
        const password = Buffer.from(`${credentials.shortCode}${credentials.passKey}${timestamp}`).toString('base64');
        
        const payload = {
            BusinessShortCode: credentials.shortCode, // Till Number
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerBuyGoodsOnline', // For Till Numbers
            Amount: 1,
            PartyA: testParams.phone,
            PartyB: 3499162, // Till Number
            PhoneNumber: testParams.phone,
            CallBackURL: testParams.callbackUrl,
            AccountReference: 'TestPayment',
            TransactionDesc: 'Test STK Push'
        };

        const response = await axios.post(
            'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('\n✅ STK Push initiated successfully!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('\n❌ Error in STK Push:', {
            message: error.message,
            response: error.response?.data || 'No response data',
            status: error.response?.status
        });
    }
}

// Run the test
console.log('🚀 Starting M-Pesa STK Push Test\n');
stkPush().catch(console.error);
