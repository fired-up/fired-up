// @ts-nocheck
import _get from 'lodash/get';
import _map from 'lodash/map';
import { connect, ConnectedProps } from 'react-redux';
import { NextPage } from 'next';
import format from 'date-fns/format';
import MaterialTable from 'material-table';
import React, { useEffect } from 'react';

import { Link } from '@material-ui/core';
import Code from '../../components/Code';
import DashboardLayout from '../../layouts/Dashboard';
import forms from '../../components/Forms/stores';
import NextLink from '../../components/NextLink';
import TableHeader from '../../components/TableHeader';

import EditIcon from '@material-ui/icons/Edit';
import Icon from '@material-ui/core/Icon';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { colors } from '../../styles/variables';

import { CREATED_AT_DATE_FORMATTING } from '../../utils/constants';

type PropsFromRedux = ConnectedProps<typeof connector>;
type FormsIndexProps = PropsFromRedux;

const FormsIndex: NextPage = (props: FormsIndexProps) => {
  useEffect(() => {
    props.fetchForms();
  }, []);

  const cols = !props.forms
    ? []
    : _map(props.forms, form => {
        return {
          name: form.name,
          id: form.id,
          autoresponder_id: form.autoresponder_id,
          created_at: form.created_at
            ? format(form.created_at, CREATED_AT_DATE_FORMATTING)
            : null,
          last_modified: form.updated_at
            ? format(form.updated_at, CREATED_AT_DATE_FORMATTING)
            : null,
          total_submissions: form.total_submissions,
        };
      });

  return (
    <DashboardLayout title="Forms">
      <MaterialTable
        columns={[
          {
            title: 'Form title',
            field: 'name',
            render: rowData => (
              <Link component={NextLink} href={`/forms/${rowData.id}`}>
                {rowData.name}
              </Link>
            ),
          },
          {
            title: 'Form ID',
            field: 'id',
            render: rowData => <Code>{rowData.id}</Code>,
          },
          {
            title: 'Autoresponder ID',
            field: 'autoresponder_id',
            render: rowData => <Code>{rowData.autoresponder_id}</Code>,
          },
          { title: 'Created ', field: 'created_at', defaultSort: 'desc' },
          { title: 'Last modified', field: 'last_modified' },
          { title: 'Total submissions', field: 'total_submissions' },
          {
            render: rowData => (
              <>
                <Link component={NextLink} href={`/forms/${rowData.id}`}>
                  <Tooltip title="Edit">
                    <IconButton aria-label="edit">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </Link>
                <Link
                  component={NextLink}
                  href={`/forms/${rowData.id}/submissions`}
                  prefetch={false}
                >
                  <Tooltip title="View submissions">
                    <IconButton aria-label="view submissions">
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                </Link>
              </>
            ),
          },
        ]}
        data={cols}
        options={{
          pageSize: 20,
          headerStyle: {
            fontWeight: 'bold',
            backgroundColor: colors['table-header-gray'],
          },
        }}
        title={
          <TableHeader
            action="Create new"
            href="/forms/create"
            title="Forms"
            startIcon={<Icon>add</Icon>}
          />
        }
      />
    </DashboardLayout>
  );
};

const mapState = state => ({
  forms: _get(state, 'adminForms.forms'),
});

const mapDispatch = dispatch => ({
  fetchForms: () => dispatch(forms.getForms()),
});

const connector = connect(
  mapState,
  mapDispatch
);

export default connector(FormsIndex);
