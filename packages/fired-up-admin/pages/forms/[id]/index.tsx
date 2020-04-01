import { NextPage, NextPageContext } from 'next';
import React from 'react';

import AdminLayout from '../../../layouts/Dashboard';
import Edit from '../../../components/Forms/FormsEdit';

const FormsEdit: NextPage = ({ id }) => {
  return (
    <AdminLayout title={id ? 'Edit form' : 'Create form'}>
      <Edit id={id || null} />
    </AdminLayout>
  );
};

FormsEdit.getInitialProps = async ({ query }: NextPageContext) => {
  const { id } = query;
  return { id };
};

export default FormsEdit;
