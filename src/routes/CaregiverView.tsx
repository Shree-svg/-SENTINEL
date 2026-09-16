import React from 'react';
import CaregiverView from '@/components/CaregiverView';

type Props = { role: 'caregiver' };

export default function CaregiverPage({ role }: Props) {
  return <CaregiverView />;
}
