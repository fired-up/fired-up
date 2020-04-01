import { NextPage } from 'next';
import React from 'react';

import DashboardLayout from '../../../layouts/Dashboard';
import Edit from '../../../components/Forms/FormsEdit';

const FormCreate: NextPage = () => {
  return (
    <DashboardLayout title="Create form">
      <Edit />
    </DashboardLayout>
  );
};

export default FormCreate;
