// components/FileViewer.tsx
import React, { useState, useEffect } from 'react';
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
  IonToast,
  IonFooter
} from '@ionic/react';
import { close, download, copyOutline } from 'ionicons/icons';

interface FileViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileBlob: Blob | null;
  fileName: string;
  mimeType: string;
}

const FileViewer: React.FC<FileViewerProps> = ({
  isOpen,
  onClose,
  fileBlob,
  fileName,
  mimeType
}) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  useEffect(() => {
    if (fileBlob && isOpen) {
      const url = URL.createObjectURL(fileBlob);
      setFileUrl(url);

      // If it's a text file, read the content
      if (mimeType.startsWith('text/') || mimeType === 'application/json') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setTextContent(e.target?.result as string);
          setLoading(false);
        };
        reader.onerror = () => {
          setError('Failed to read file content');
          setLoading(false);
        };
        reader.readAsText(fileBlob);
      } else {
        setLoading(false);
      }

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [fileBlob, isOpen, mimeType]);

  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.click();
    }
  };

  const handleCopyText = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      setToastMessage('Code copied to clipboard!');
      setShowToast(true);
    }
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="ion-padding ion-text-center">
          <p className="ion-text-danger">{error}</p>
          <IonButton onClick={onClose}>Close</IonButton>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="ion-padding ion-text-center">
          <IonSpinner name="crescent" />
          <p>Loading file...</p>
        </div>
      );
    }

    // Images
    if (mimeType.startsWith('image/')) {
      return (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={fileUrl!}
            alt={fileName}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        </div>
      );
    }

    // PDFs
    if (mimeType === 'application/pdf') {
      return (
        <iframe
          src={fileUrl!}
          title={fileName}
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        />
      );
    }

    // Text files (including coupon codes)
    if (mimeType.startsWith('text/') || mimeType === 'application/json') {
      return (
        <div className="ion-padding">
          <div style={{
            backgroundColor: 'var(--ion-color-light)',
            padding: '20px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            fontSize: '16px'
          }}>
            {textContent}
          </div>
        </div>
      );
    }

    // Fallback
    return (
      <div className="ion-padding ion-text-center">
        <p>This file type cannot be previewed directly.</p>
        <IonButton onClick={handleDownload}>
          <IonIcon slot="start" icon={download} />
          Download File
        </IonButton>
      </div>
    );
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{fileName}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onClose}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          {renderContent()}
        </IonContent>

        {(mimeType.startsWith('text/') || mimeType === 'application/json') && textContent && (
          <IonFooter>
            <IonToolbar>
              <IonButtons slot="end">
                <IonButton onClick={handleCopyText}>
                  <IonIcon slot="start" icon={copyOutline} />
                  Copy Code
                </IonButton>
                <IonButton onClick={handleDownload}>
                  <IonIcon slot="start" icon={download} />
                  Download
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonFooter>
        )}

        {!mimeType.startsWith('text/') && mimeType !== 'application/json' && fileUrl && (
          <IonFooter>
            <IonToolbar>
              <IonButtons slot="end">
                <IonButton onClick={handleDownload}>
                  <IonIcon slot="start" icon={download} />
                  Download
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonFooter>
        )}
      </IonModal>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="bottom"
      />
    </>
  );
};

export default FileViewer;
