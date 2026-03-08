import React, { useEffect, useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonSpinner,
} from '@ionic/react';
import { closeOutline, printOutline, checkmarkCircle } from 'ionicons/icons';
import apiClient, { PrintSettings } from '@services/APIService';
import './ReceiptModal.css';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  couponCode: string;
  couponCodes?: string[];
  planName: string;
  amount: number;
  transactionId: number | null;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  couponCode,
  couponCodes,
  planName,
  amount,
  transactionId,
}) => {
  const [printSettings, setPrintSettings] = useState<PrintSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const fallbackPrintSettings: PrintSettings = {
    header_text: 'CouponPay - Recharge Coupon',
    footer_text: 'Thank you for your purchase!',
    include_qr: true,
    include_logo: true,
    font_size: '12px',
    paper_size: '80mm',
  };

  useEffect(() => {
    if (isOpen) {
      fetchPrintSettings();
    }
  }, [isOpen]);

  const fetchPrintSettings = async () => {
    try {
      setLoading(true);
      const settings = await apiClient.getPrintSettings();
      setPrintSettings(settings);
    } catch (error) {
      console.error('Failed to fetch print settings:', error);
      // Use defaults
      setPrintSettings(fallbackPrintSettings);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const qrUrl = primaryCode ? getQrCodeUrl(primaryCode) : '';
    const settings = activePrintSettings;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Purchase Receipt</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: ${settings.font_size || '12px'};
            background: #fff;
            padding: 20px;
          }
          .receipt {
            max-width: 350px;
            margin: 0 auto;
            background: #fff;
          }
          .header {
            text-align: center;
            margin-bottom: 16px;
          }
          .logo {
            font-size: 48px;
            color: #059669;
            margin-bottom: 8px;
          }
          .title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
          }
          .success {
            color: #059669;
            font-weight: 500;
          }
          .divider {
            border-top: 1px dashed #d1d5db;
            margin: 16px 0;
          }
          .section {
            margin-bottom: 16px;
          }
          .section h2 {
            font-size: 14px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 12px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .label { color: #6b7280; }
          .value { color: #1f2937; font-weight: 500; }
          .amount { font-size: 16px; font-weight: 600; color: #059669; }
          .code-section { text-align: center; }
          .code-box {
            background: #dbeafe;
            border: 2px solid #2563eb;
            border-radius: 8px;
            padding: 16px;
            margin-top: 8px;
          }
          .code {
            font-family: 'Courier New', monospace;
            font-size: 20px;
            font-weight: 700;
            color: #1d4ed8;
            letter-spacing: 0.1em;
            word-break: break-all;
          }
          .qr-section {
            text-align: center;
            padding: 16px 0;
          }
          .qr-code {
            width: 150px;
            height: 150px;
            display: block;
            margin: 0 auto;
          }
          .qr-hint {
            color: #6b7280;
            font-size: 12px;
            margin-top: 8px;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            padding-top: 8px;
          }
          @media print {
            body { padding: 0; }
            @page { margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            ${settings.include_logo ? '<div class="logo">✓</div>' : ''}
            <div class="title">${settings.header_text}</div>
            <div class="success">Purchase Successful</div>
          </div>

          <div class="divider"></div>

          <div class="section">
            <h2>Order Details</h2>
            <div class="row">
              <span class="label">Plan:</span>
              <span class="value">${planName}</span>
            </div>
            <div class="row">
              <span class="label">Amount:</span>
              <span class="value amount">$${amount.toFixed(2)}</span>
            </div>
            <div class="row">
              <span class="label">Date:</span>
              <span class="value">${currentDate}</span>
            </div>
            ${transactionId ? `
            <div class="row">
              <span class="label">Transaction ID:</span>
              <span class="value">#${transactionId}</span>
            </div>
            ` : ''}
          </div>

          <div class="divider"></div>

          <div class="section code-section">
            <h2>Your Coupon Code</h2>
            <div class="code-box">
              <span class="code">${primaryCode || 'N/A'}</span>
            </div>
          </div>

          ${settings.include_qr && primaryCode ? `
          <div class="section qr-section">
            <img src="${qrUrl}" alt="QR Code" class="qr-code" id="qr-image" />
            <p class="qr-hint">Scan to redeem</p>
          </div>
          ` : ''}

          <div class="divider"></div>

          <div class="footer">
            <p>${settings.footer_text}</p>
          </div>
        </div>

        <script>
          // Wait for QR image to load before printing
          const qrImage = document.getElementById('qr-image');
          if (qrImage) {
            qrImage.onload = function() {
              window.print();
              window.close();
            };
            qrImage.onerror = function() {
              window.print();
              window.close();
            };
          } else {
            window.print();
            window.close();
          }
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  const normalizedCodes = (couponCodes?.length ? couponCodes : [couponCode])
    .map((code) => code?.trim())
    .filter((code): code is string => typeof code === 'string' && code.length > 0);
  const primaryCode = normalizedCodes[0];

  const getQrCodeUrl = (code: string) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    let origin = backendUrl;
    try {
      origin = new URL(backendUrl).origin;
    } catch {
      origin = backendUrl.replace(/\/+$/, '');
    }
    return `${origin}/qr/${encodeURIComponent(code)}`;
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const activePrintSettings = printSettings ?? fallbackPrintSettings;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="receipt-modal">
      <IonHeader className="no-print">
        <IonToolbar>
          <IonTitle>Purchase Receipt</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handlePrint}>
              <IonIcon icon={printOutline} slot="icon-only" />
            </IonButton>
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {loading ? (
          <div className="receipt-loading">
            <IonSpinner name="crescent" />
            <p>Loading receipt...</p>
          </div>
        ) : (
          <div
            className="receipt-container"
            style={{ fontSize: activePrintSettings.font_size || '12px' }}
          >
            {/* Header */}
            <div className="receipt-header">
              {activePrintSettings.include_logo && (
                <div className="receipt-logo">
                  <IonIcon icon={checkmarkCircle} color="success" />
                </div>
              )}
              <h1 className="receipt-title">{activePrintSettings.header_text}</h1>
              <p className="receipt-success">Purchase Successful</p>
            </div>

            {/* Divider */}
            <div className="receipt-divider" />

            {/* Order Details */}
            <div className="receipt-section">
              <h2>Order Details</h2>
              <div className="receipt-row">
                <span className="receipt-label">Plan:</span>
                <span className="receipt-value">{planName}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Amount:</span>
                <span className="receipt-value receipt-amount">${amount.toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Date:</span>
                <span className="receipt-value">{currentDate}</span>
              </div>
              {transactionId && (
                <div className="receipt-row">
                  <span className="receipt-label">Transaction ID:</span>
                  <span className="receipt-value">#{transactionId}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="receipt-divider" />

            {/* Coupon Code */}
            <div className="receipt-section receipt-code-section">
              <h2>Your Coupon Code</h2>
              <div className="receipt-code-box">
                {primaryCode ? (
                  <code className="receipt-code">{primaryCode}</code>
                ) : (
                  <p className="receipt-code-missing">Coupon code not available yet.</p>
                )}
              </div>
            </div>

            {/* QR Code */}
            {activePrintSettings.include_qr && primaryCode && (
              <div className="receipt-section receipt-qr-section">
                <img
                  src={getQrCodeUrl(primaryCode)}
                  alt="QR Code"
                  className="receipt-qr-code"
                />
                <p className="receipt-qr-hint">Scan to redeem</p>
              </div>
            )}

            {/* Divider */}
            <div className="receipt-divider" />

            {/* Footer */}
            <div className="receipt-footer">
              <p>{activePrintSettings.footer_text}</p>
            </div>
          </div>
        )}

        {/* Print Button - Mobile */}
        {!loading && (
          <div className="receipt-actions no-print">
            <IonButton expand="block" onClick={handlePrint}>
              <IonIcon icon={printOutline} slot="start" />
              Print Receipt
            </IonButton>
            <IonButton expand="block" fill="outline" onClick={onClose}>
              Close
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default ReceiptModal;
