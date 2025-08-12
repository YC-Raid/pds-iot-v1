import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Download, Check } from "lucide-react";
import QRCode from "qrcode";

interface QRCodeGeneratorProps {
  url: string;
  title?: string;
  description?: string;
  size?: number;
  className?: string;
}

export function QRCodeGenerator({ 
  url, 
  title, 
  description, 
  size = 200,
  className = "" 
}: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrUrl = await QRCode.toDataURL(url, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQR();
  }, [url, size]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `qr-code-${title?.replace(/\s+/g, '-').toLowerCase() || 'alert'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* QR Code Display */}
      <div className="flex justify-center">
        <Card className="p-4">
          <CardContent className="p-0">
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                loading="lazy"
                decoding="async"
                className="rounded-lg"
                width={size}
                height={size}
              />
            ) : (
              <div 
                className="bg-muted animate-pulse rounded-lg"
                style={{ width: size, height: size }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* URL Display */}
      <div className="space-y-2">
        <div className="p-3 bg-muted/50 rounded-lg font-mono text-sm break-all">
          {url}
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyUrl}
            className="flex items-center gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy URL'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadQR}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download QR
          </Button>
        </div>
      </div>

      {/* Context Information */}
      {(title || description) && (
        <div className="text-center space-y-1">
          {title && (
            <p className="font-medium text-sm">{title}</p>
          )}
          {description && (
            <p className="text-muted-foreground text-xs">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}