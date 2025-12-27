import QRCode from "qrcode.react";

export default function GenerarQR({ valor }) {
  if (!valor) return null;

  return <QRCode value={valor} size={150} />;
}