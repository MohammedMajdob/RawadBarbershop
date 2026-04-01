import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ניהול המספרה',
  manifest: '/admin-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'אדמין',
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
