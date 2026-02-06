/**
 * PDF Receipt Generator
 * 
 * Generates professional PDF receipts for payments.
 * Uses basic text formatting for maximum compatibility.
 */

import { prisma } from '@suvidha/database';

interface ReceiptData {
    receiptNo: string;
    transactionId: string;
    amount: number;
    paymentMethod: string;
    paidAt: Date;
    user: {
        name: string;
        phone: string;
        address?: string;
    };
    bill: {
        billNo: string;
        serviceType: string;
        connectionNo: string;
        address: string;
        city: string;
        periodFrom: Date;
        periodTo: Date;
        totalAmount: number;
    };
}

/**
 * Generate PDF receipt content as HTML (can be converted to PDF by browser)
 */
export function generateReceiptHTML(data: ReceiptData, language: 'en' | 'hi' = 'en'): string {
    const isHindi = language === 'hi';

    const serviceLabels: Record<string, { en: string; hi: string }> = {
        ELECTRICITY: { en: 'Electricity', hi: 'बिजली' },
        GAS: { en: 'Gas', hi: 'गैस' },
        WATER: { en: 'Water', hi: 'पानी' },
        MUNICIPAL: { en: 'Municipal', hi: 'नगरपालिका' },
    };

    const serviceLabel = serviceLabels[data.bill.serviceType]?.[language] || data.bill.serviceType;

    return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isHindi ? 'भुगतान रसीद' : 'Payment Receipt'} - ${data.receiptNo}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .receipt {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8c 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 8px;
    }
    .header p {
      opacity: 0.8;
      font-size: 14px;
    }
    .success-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #22c55e;
      color: white;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: 600;
      margin: -20px auto 20px;
      position: relative;
      z-index: 1;
    }
    .content {
      padding: 24px;
    }
    .amount-section {
      background: #f8fafc;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin-bottom: 24px;
    }
    .amount-label {
      color: #64748b;
      font-size: 14px;
      margin-bottom: 8px;
    }
    .amount {
      font-size: 42px;
      font-weight: bold;
      color: #1e3a5f;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-weight: 600;
      color: #1e3a5f;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 16px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .row:last-child {
      border-bottom: none;
    }
    .label {
      color: #64748b;
    }
    .value {
      font-weight: 500;
      color: #1e293b;
      font-family: monospace;
    }
    .address-box {
      background: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #64748b;
      font-size: 12px;
      border-top: 1px solid #e2e8f0;
    }
    .print-btn {
      display: block;
      width: 100%;
      max-width: 200px;
      margin: 20px auto;
      padding: 12px 24px;
      background: #0ea5e9;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
    }
    .print-btn:hover {
      background: #0284c7;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .receipt {
        box-shadow: none;
      }
      .print-btn {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>🏛️ SUVIDHA</h1>
      <p>${isHindi ? 'एकीकृत नागरिक सेवा पोर्टल' : 'Unified Civic Services Portal'}</p>
    </div>
    
    <div style="text-align: center;">
      <div class="success-badge">
        ✓ ${isHindi ? 'भुगतान सफल' : 'Payment Successful'}
      </div>
    </div>
    
    <div class="content">
      <div class="amount-section">
        <div class="amount-label">${isHindi ? 'भुगतान राशि' : 'Amount Paid'}</div>
        <div class="amount">₹${data.amount.toLocaleString('en-IN')}</div>
      </div>
      
      <div class="section">
        <div class="section-title">${isHindi ? 'लेनदेन विवरण' : 'Transaction Details'}</div>
        <div class="row">
          <span class="label">${isHindi ? 'रसीद संख्या' : 'Receipt No'}</span>
          <span class="value">${data.receiptNo}</span>
        </div>
        <div class="row">
          <span class="label">${isHindi ? 'लेनदेन ID' : 'Transaction ID'}</span>
          <span class="value" style="font-size: 11px;">${data.transactionId}</span>
        </div>
        <div class="row">
          <span class="label">${isHindi ? 'दिनांक और समय' : 'Date & Time'}</span>
          <span class="value">${new Date(data.paidAt).toLocaleString('en-IN')}</span>
        </div>
        <div class="row">
          <span class="label">${isHindi ? 'भुगतान विधि' : 'Payment Method'}</span>
          <span class="value">${data.paymentMethod}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">${isHindi ? 'सेवा विवरण' : 'Service Details'}</div>
        <div class="row">
          <span class="label">${isHindi ? 'सेवा प्रकार' : 'Service Type'}</span>
          <span class="value">${serviceLabel}</span>
        </div>
        <div class="row">
          <span class="label">${isHindi ? 'कनेक्शन संख्या' : 'Connection No'}</span>
          <span class="value">${data.bill.connectionNo}</span>
        </div>
        <div class="row">
          <span class="label">${isHindi ? 'बिल संख्या' : 'Bill No'}</span>
          <span class="value">${data.bill.billNo}</span>
        </div>
        <div class="row">
          <span class="label">${isHindi ? 'बिल अवधि' : 'Bill Period'}</span>
          <span class="value">${new Date(data.bill.periodFrom).toLocaleDateString('en-IN')} - ${new Date(data.bill.periodTo).toLocaleDateString('en-IN')}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">${isHindi ? 'ग्राहक विवरण' : 'Customer Details'}</div>
        <div class="row">
          <span class="label">${isHindi ? 'नाम' : 'Name'}</span>
          <span class="value">${data.user.name}</span>
        </div>
        <div class="row">
          <span class="label">${isHindi ? 'फोन' : 'Phone'}</span>
          <span class="value">${data.user.phone}</span>
        </div>
        <div class="address-box">
          <span class="label">${isHindi ? 'सेवा पता' : 'Service Address'}</span>
          <div style="margin-top: 8px; font-weight: 500;">
            ${data.bill.address}, ${data.bill.city}
          </div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>${isHindi ? 'यह एक कंप्यूटर जनित रसीद है।' : 'This is a computer generated receipt.'}</p>
      <p style="margin-top: 4px;">${isHindi ? 'भुगतान के लिए धन्यवाद!' : 'Thank you for your payment!'}</p>
      <p style="margin-top: 16px; font-size: 10px; opacity: 0.7;">
        SUVIDHA - Smart Urban Virtual Interactive Digital Helpdesk Assistant
      </p>
    </div>
  </div>
  
  <button class="print-btn" onclick="window.print()">
    🖨️ ${isHindi ? 'प्रिंट करें' : 'Print Receipt'}
  </button>
</body>
</html>
  `.trim();
}

/**
 * Generate receipt data from payment ID
 */
export async function getReceiptData(paymentId: string, userId: string): Promise<ReceiptData | null> {
    const payment = await prisma.payment.findFirst({
        where: {
            id: paymentId,
            userId: userId,
            status: 'SUCCESS',
        },
        include: {
            user: true,
            bill: {
                include: {
                    connection: true,
                },
            },
        },
    });

    if (!payment) {
        return null;
    }

    return {
        receiptNo: payment.receiptNo || `RCP${payment.id.slice(0, 8).toUpperCase()}`,
        transactionId: payment.transactionId || payment.id,
        amount: payment.amount,
        paymentMethod: payment.method,
        paidAt: payment.paidAt || payment.createdAt,
        user: {
            name: payment.user.name,
            phone: payment.user.phone,
            address: payment.user.address || undefined,
        },
        bill: {
            billNo: payment.bill.billNo,
            serviceType: payment.bill.connection.serviceType,
            connectionNo: payment.bill.connection.connectionNo,
            address: payment.bill.connection.address,
            city: payment.bill.connection.city,
            periodFrom: payment.bill.periodFrom,
            periodTo: payment.bill.periodTo,
            totalAmount: payment.bill.totalAmount,
        },
    };
}

/**
 * Generate text-based receipt for download
 */
export function generateReceiptText(data: ReceiptData): string {
    return `
================================================================================
                         SUVIDHA - UNIFIED CIVIC SERVICES
                           PAYMENT RECEIPT
================================================================================

Receipt No:      ${data.receiptNo}
Transaction ID:  ${data.transactionId}
Date & Time:     ${new Date(data.paidAt).toLocaleString('en-IN')}

--------------------------------------------------------------------------------
                           PAYMENT DETAILS
--------------------------------------------------------------------------------

Amount Paid:     ₹${data.amount.toLocaleString('en-IN')}
Payment Method:  ${data.paymentMethod}
Status:          SUCCESSFUL ✓

--------------------------------------------------------------------------------
                           SERVICE DETAILS
--------------------------------------------------------------------------------

Service Type:    ${data.bill.serviceType}
Connection No:   ${data.bill.connectionNo}
Bill No:         ${data.bill.billNo}
Bill Period:     ${new Date(data.bill.periodFrom).toLocaleDateString('en-IN')} to ${new Date(data.bill.periodTo).toLocaleDateString('en-IN')}
Total Bill:      ₹${data.bill.totalAmount.toLocaleString('en-IN')}

--------------------------------------------------------------------------------
                           CUSTOMER DETAILS
--------------------------------------------------------------------------------

Name:            ${data.user.name}
Phone:           ${data.user.phone}
Service Address: ${data.bill.address}, ${data.bill.city}

================================================================================
          This is a computer generated receipt. Thank you for your payment!
================================================================================
                    Smart Urban Virtual Interactive Digital Helpdesk Assistant
================================================================================
  `.trim();
}
