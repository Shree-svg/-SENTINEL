import React from 'react';
import AlertHistoryList from '@/components/AlertHistoryList';

type Props = { role: 'resident' | 'caregiver' | 'admin' };

export default function AlertHistory({ role }: Props) {
  return <AlertHistoryList role={role} />;
}
