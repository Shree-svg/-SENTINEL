import React from 'react';
import AdminCalibrationView from '@/components/AdminCalibrationView';

type Props = { role: 'admin' };

export default function AdminCalibrationPage({ role }: Props) {
  return <AdminCalibrationView />;
}
