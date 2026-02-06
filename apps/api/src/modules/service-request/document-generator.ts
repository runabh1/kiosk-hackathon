import { prisma } from '@suvidha/database';

interface ServiceRequestApprovalData {
  ticketNo: string;
  requestType: string;
  status: string;
  description: string;
  resolvedAt: Date;
  user: {
    name: string;
    phone: string;
    address?: string;
  };
  connection?: {
    connectionNo: string;
    serviceType: string;
    address: string;
    city: string;
  };
}

/**
 * Generate Approval Certificate HTML
 */
export function generateApprovalHTML(data: any, language: 'en' | 'hi' = 'en'): string {
  const isHindi = language === 'hi';
  const date = data.resolvedAt ? new Date(data.resolvedAt) : new Date();

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isHindi ? 'अनुमोदन प्रमाण पत्र' : 'Approval Certificate'} - ${data.id.slice(0, 8).toUpperCase()}</title>
  <style>
    body { font-family: 'Segoe UI', serif; padding: 40px; background: #f0f4f8; }
    .certificate { 
        max-width: 800px; 
        margin: 0 auto; 
        background: white; 
        padding: 60px; 
        border: 15px solid #1e3a5f; 
        position: relative;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .watermark {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 100px;
        color: rgba(30, 58, 95, 0.05);
        pointer-events: none;
        white-space: nowrap;
        font-weight: bold;
    }
    .header { text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 40px; }
    .header h1 { color: #1e3a5f; margin: 0; font-size: 34px; letter-spacing: 2px; }
    .title { text-align: center; margin-bottom: 50px; }
    .title h2 { font-size: 28px; color: #b91c1c; text-decoration: underline; }
    .content { line-height: 1.8; color: #334155; font-size: 18px; }
    .highlight { font-weight: bold; color: #0f172a; }
    .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
    .signature { text-align: center; border-top: 1px solid #1e3a5f; padding-top: 10px; width: 200px; }
    .stamp { width: 120px; height: 120px; border: 4px double #b91c1c; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #b91c1c; font-weight: bold; transform: rotate(-15deg); margin-left: 50px; }
    @media print { .print-btn { display: none; } body { padding: 0; background: white; } }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="watermark">SUVIDHA GOVT</div>
    <div class="header">
      <h1>🏛️ SUVIDHA PORTAL</h1>
      <p>Government of India | Unified Civic Services Authority</p>
    </div>
    
    <div class="title">
      <h2>${isHindi ? 'आधिकारिक अनुमोदन प्रमाण पत्र' : 'OFFICIAL APPROVAL CERTIFICATE'}</h2>
    </div>
    
    <div class="content">
      <p>${isHindi ? 'यह प्रमाणित किया जाता है कि' : 'This is to formally certify that the service request regarding'} <span class="highlight">${data.type.replace('_', ' ')}</span> ${isHindi ? 'के संबंध में सेवा अनुरोध सक्षम प्राधिकारी द्वारा अनुमोदित किया गया है।' : 'has been duly reviewed and APPROVED by the competent authority.'}</p>
      
      <div style="margin: 30px 0; background: #f8fafc; padding: 20px; border-radius: 8px;">
        <table style="width: 100%;">
          <tr>
            <td><strong>${isHindi ? 'लाभार्थी का नाम' : 'Beneficiary Name'}:</strong></td>
            <td>${data.user.name}</td>
          </tr>
          <tr>
            <td><strong>${isHindi ? 'संपर्क संख्या' : 'Contact No'}:</strong></td>
            <td>${data.user.phone}</td>
          </tr>
          ${data.connection ? `
          <tr>
            <td><strong>${isHindi ? 'कनेक्शन संख्या' : 'Connection No'}:</strong></td>
            <td>${data.connection.connectionNo}</td>
          </tr>
          <tr>
            <td><strong>${isHindi ? 'सेवा प्रकार' : 'Service Type'}:</strong></td>
            <td>${data.connection.serviceType}</td>
          </tr>
          ` : ''}
          <tr>
            <td><strong>${isHindi ? 'अनुमोदन तिथि' : 'Approval Date'}:</strong></td>
            <td>${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
          </tr>
        </table>
      </div>
      
      <p style="margin-top: 30px;">
        ${isHindi ? 'विवरण:' : 'Remarks:'} <br/>
        <span style="font-style: italic;">${data.description}</span>
      </p>
    </div>
    
    <div class="footer">
      <div>
        <p><strong>${isHindi ? 'दिनांक:' : 'Date:'}</strong> ${new Date().toLocaleDateString('en-IN')}</p>
        <p><strong>${isHindi ? 'स्थान:' : 'Place:'}</strong> Digital Secretariat</p>
      </div>
      
      <div class="stamp">
          <div style="font-size: 10px;">APPROVED</div>
          <div style="font-size: 16px;">🏛️</div>
          <div style="font-size: 10px;">SUVIDHA</div>
      </div>

      <div class="signature">
        <p>Digitally Signed</p>
        <p style="font-size: 12px; color: #64748b;">(Authorized Signatory)</p>
      </div>
    </div>
  </div>

  <div style="text-align: center; margin-top: 30px;">
    <button onclick="window.print()" style="padding: 12px 24px; background: #1e3a5f; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
        🖨️ ${isHindi ? 'प्रमाण पत्र प्रिंट करें' : 'Print Certificate'}
    </button>
  </div>
</body>
</html>
    `.trim();
}


/**
 * Generate Sanction Letter HTML
 */
export function generateSanctionLetterHTML(data: any, language: 'en' | 'hi' = 'en'): string {
  const isHindi = language === 'hi';
  const date = data.connectionDate ? new Date(data.connectionDate) : new Date();

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isHindi ? 'मंजूरी पत्र' : 'Sanction Letter'} - ${data.connectionNo}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; padding: 50px; background: white; color: #000; line-height: 1.6; }
    .letterhead { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 30px; }
    .letterhead h1 { font-size: 24px; margin: 0; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .subject { font-weight: bold; text-decoration: underline; margin: 20px 0; text-align: center; }
    .content { text-align: justify; }
    .footer { margin-top: 100px; display: flex; justify-content: space-between; }
    .sig-block { width: 250px; text-align: center; }
    .terms { font-size: 11px; margin-top: 50px; border-top: 1px dashed #ccc; padding-top: 10px; color: #666; }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>GOVERNMENT OF ASSAM</h1>
    <h2>OFFICE OF THE MUNICIPAL CORPORATION / UTILITY BOARD</h2>
    <p>Regional Office: Guwahati, Kamrup (M) | Portal: suvidha.assam.gov.in</p>
  </div>

  <div class="meta">
    <div>
      Ref No: <strong>SUVIDHA/SANCTION/${data.connectionNo}</strong>
    </div>
    <div>
      Date: <strong>${date.toLocaleDateString('en-IN')}</strong>
    </div>
  </div>

  <p>To,<br/>
  <strong>Mr./Ms. ${data.user.name}</strong><br/>
  ${data.address},<br/>
  ${data.city}, ${data.state} - ${data.pincode}</p>

  <div class="subject">
    SUBJECT: SANCTION OF NEW ${data.serviceType} CONNECTION (AC NO: ${data.connectionNo})
  </div>

  <div class="content">
    <p>Dear Valued Citizen,</p>
    <p>With reference to your application for a new <strong>${data.serviceType}</strong> connection, we are pleased to inform you that your request has been formally <strong>SANCTIONED</strong> following successful technical feasibility and document verification.</p>
    
    <p>Details of Approval:</p>
    <ul>
      <li><strong>Connection Number:</strong> ${data.connectionNo}</li>
      <li><strong>Service Category:</strong> ${data.serviceType}</li>
      <li><strong>Status:</strong> ${data.status}</li>
      ${data.meterNo ? `<li><strong>Meter Number:</strong> ${data.meterNo}</li>` : ''}
      ${data.sanctionedLoad ? `<li><strong>Sanctioned Load:</strong> ${data.sanctionedLoad} kW</li>` : ''}
    </ul>

    <p>Please note that this connection is subject to the terms and conditions of the Utility Board. The billing will commence from the date of activation. You are advised to maintain the security deposits and provide clear access to the meter for periodic readings.</p>
    
    <p>This letter acts as an official document of sanction and can be used for address verification or other legal purposes where applicable.</p>
  </div>

  <div class="footer">
    <div class="sig-block">
        <div style="height: 50px;"></div>
        <p>Digitally Approved</p>
        <p><strong>Dy. General Manager (Suvidha)</strong></p>
    </div>
    <div style="text-align: right;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://suvidha.assam.gov.in/verify/${data.id}" alt="QR Verify" width="100"/>
        <p style="font-size: 10px;">Scan to Verify</p>
    </div>
  </div>

  <div class="terms">
    Disclaimer: This is a system-generated document and does not require a physical signature. Any tampering with this document will lead to immediate cancellation of services and legal action.
  </div>

  <div style="text-align: center; margin-top: 30px;" class="print-btn">
    <button onclick="window.print()" style="padding: 10px 20px; background: #000; color: #fff; border: none; cursor: pointer;">
        Print Sanction Letter
    </button>
  </div>
</body>
</html>
    `.trim();
}

/**
 * Fetch data for sanction letter
 */
export async function getSanctionLetterData(connectionId: string, userId: string) {
  return prisma.serviceConnection.findFirst({
    where: {
      id: connectionId,
      userId,
      status: 'ACTIVE'
    },
    include: {
      user: true
    }
  });
}

/**
 * Fetch data for service request document
 */
export async function getApprovalDocumentData(requestId: string, userId: string) {
  return prisma.serviceRequest.findFirst({
    where: {
      id: requestId,
      userId,
      status: 'COMPLETED'
    },
    include: {
      user: true,
      connection: true
    }
  });
}
