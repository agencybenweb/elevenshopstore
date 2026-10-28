import type { Metadata } from 'next';
import AdminPanel from '@/components/admin/AdminPanel';

export const metadata: Metadata = {
  title: 'Administration & Commandes en direct — Eleven Shop Roanne',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <AdminPanel />;
}
