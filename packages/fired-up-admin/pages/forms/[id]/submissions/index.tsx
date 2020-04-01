import _clone from 'lodash/clone';
import _difference from 'lodash/difference';
import _forEach from 'lodash/forEach';
import _isEmpty from 'lodash/isEmpty';
import format from 'date-fns/format';
import MaterialTable from 'material-table';
import React, { useEffect, useState } from 'react';
import FileSaver from 'file-saver';
import stringify from 'csv-stringify/lib/sync';

import DashboardLayout from '../../../../layouts/Dashboard';

import { getSignupsByForm } from '../../../../components/Forms/library/signups';
import { CREATED_AT_DATE_FORMATTING } from '../../../../utils/constants';
import { NextPage } from 'next';
import Code from '../../../../components/Code';
import { colors } from '../../../../styles/variables';

type FormSubmissionProps = {
  id: string;
};

const FormSubmissionsPage: NextPage = (props: FormSubmissionProps) => {
  const [signupsState, setSignups] = useState({});
  useEffect(() => {
    async function fetchSignups() {
      try {
        const signups = await getSignupsByForm(props.id);
        setSignups(signups);
      } catch (err) {
        console.log(err);
      }
    }

    fetchSignups();
  }, []);

  function generateTabularData() {
    if (_isEmpty(signupsState)) {
      return [];
    }

    let key = 1;
    const table = [];
    const fields = [];
    const signups = _clone(signupsState);

    // Get the unique fields for each signup to generate a fields list
    for (const signup of signupsState) {
      for (const field of Object.keys(signup.fields)) {
        if (fields.indexOf(field) === -1) {
          fields.push(field);
        }
      }
    }

    // Expand every signup to set blank fields to null
    for (const i in signups) {
      const signupFields = [];

      for (const field of Object.keys(signups[i].fields)) {
        if (signupFields.indexOf(field) === -1) {
          signupFields.push(field);
        }
      }

      // What form fields aren't in this signup?
      const diff = _difference(fields, signupFields);

      // Set missing fields to null
      for (const field of diff) {
        signups[i].fields[field] = null;
      }
    }

    for (const signup of signups) {
      const { id, form_id, fields, utm } = signup;
      delete fields.token;

      table.push({
        key,
        id,
        form_id,
        created_at: format(
          signup.created_at.toDate(),
          CREATED_AT_DATE_FORMATTING
        ),
        ...fields,
        utm_content: utm.content || '',
        utm_medium: utm.medium || '',
        utm_campaign: utm.name || '', // @segment/utm-params uses utm.name for utm_campaign
        utm_source: utm.source || '',
        utm_term: utm.term || '',
      });

      key++;
    }

    return table;
  }

  const cols = generateTabularData();

  return (
    <DashboardLayout title="Form submissions">
      <MaterialTable
        columns={[
          {
            title: 'Signup date',
            field: 'created_at',
          },
          {
            title: 'First name',
            field: 'given_name',
          },
          {
            title: 'Last name',
            field: 'family_name',
          },
          {
            title: 'Email',
            field: 'email_address',
          },
          {
            title: 'ZIP Code',
            field: 'postal_code',
          },
          {
            title: 'Firestore ID',
            render: rowData => {
              return <Code>{rowData.id}</Code>;
            },
          },
        ]}
        data={cols}
        title={`Submissions for form ${props.id}`}
        options={{
          exportAllData: true,
          exportButton: true,
          exportCsv: () => {
            const table = generateTabularData();
            const csv = stringify(table, { header: true });
            const blob = new Blob([csv], { type: 'text/plain;charset=utf-8' });

            FileSaver.saveAs(
              blob,
              `submissions-${new Date().toLocaleString()}.csv`
            );
          },
          pageSize: 25,
          headerStyle: {
            fontWeight: 'bold',
            backgroundColor: colors['table-header-gray'],
          },
        }}
      />
    </DashboardLayout>
  );
};

FormSubmissionsPage.getInitialProps = async ctx => {
  const { id } = ctx.query;
  return { id };
};

export default FormSubmissionsPage;
