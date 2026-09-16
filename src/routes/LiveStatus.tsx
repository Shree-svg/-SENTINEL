import React from 'react';
import LiveStatusPanel from '@/components/LiveStatusPanel';

type Props = { role: 'resident' | 'caregiver' | 'admin' };

export default function LiveStatus({ role }: Props) {
  return <LiveStatusPanel role={role} />;
}
