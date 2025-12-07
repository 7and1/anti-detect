import { redirect } from 'next/navigation';

export default function TlsRedirect() {
  redirect('/tools/tls-fingerprint');
}
