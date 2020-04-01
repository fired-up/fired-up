import _find from 'lodash/find';
import _map from 'lodash/map';
import { firestore, storage } from 'fired-up-core/src/library/firebase';
import {
  useCollectionData,
  useDocumentData,
} from 'react-firebase-hooks/firestore';
import format from 'date-fns/format';
import getUnixTime from 'date-fns/getUnixTime';
import MaterialTable from 'material-table';
import React from 'react';

import Code from '../../components/Code';
import DashboardLayout from '../../layouts/Dashboard';
import TableHeader from '../../components/TableHeader';

import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
import CircularProgress from '@material-ui/core/CircularProgress';
import Icon from '@material-ui/core/Icon';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

import { makeStyles } from '@material-ui/core/styles';

import { colors } from '../../styles/variables';

import { FiredUp } from '../../../fired-up-typings/functions/typings/firedup';

interface ImportWithId extends FiredUp.ImportRecord {
  id: string;
}

const useStyles = makeStyles(theme => ({
  downloadIconContainer: {
    textAlign: 'center',
  },
  downloadIcon: {
    color: theme.palette.secondary.main,
    cursor: 'pointer',
  },
}));

/**
 * Download CSV of errors
 * @param docId {string} - Firebase document ID for import
 */
async function handleInvalidDownload(docId: string) {
  try {
    const docSnapshot = await firestore
      .collection('imports')
      .doc(docId)
      .get();
    const { bucket, error_doc } = docSnapshot.data();
    const gsReference = storage.refFromURL(`gs://${bucket}/${error_doc}`);
    const downloadUrl = await gsReference.getDownloadURL();

    // https://stackoverflow.com/a/57452997/628699
    const link = document.createElement('a');
    if (link.download !== undefined) {
      link.setAttribute('href', downloadUrl);
      link.setAttribute('target', '_blank');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err) {
    console.error(err);
  }
}

function ImporterProgress({ id }) {
  const [doc, docLoading, docError] = useDocumentData<FiredUp.ImportRecord>(
    firestore.collection('imports').doc(id)
  );

  if (!doc) {
    return null;
  }

  const percent = doc.percent_complete || 0;

  return (
    <Tooltip title={`${percent.toFixed(2)}%`} placement="top">
      <CircularProgress
        color="secondary"
        size={30}
        thickness={8}
        value={percent}
        variant="static"
      />
    </Tooltip>
  );
}

function ImporterIndexPage() {
  const [imports, importsLoading, importsError] = useCollectionData<
    ImportWithId
  >(firestore.collection('imports'), { idField: 'id' });
  const classes = useStyles({});

  const cols =
    importsLoading || importsError
      ? []
      : _map(imports, item => {
          return {
            id: item.id,
            created_at_date: item.created_at.toDate(),
            created_at: getUnixTime(item.created_at.toDate()),
            completed: item.completed
              ? getUnixTime(item.completed.toDate())
              : null,
            completed_date: item.completed ? item.completed.toDate() : null,
            creator: item.created_by_name,
            error_doc: item.error_doc,
            note: item.note,
            percent_complete: item.percent_complete,
            total_records: item.total_records,
            file: item.file_name,
            invalid_records: item.invalid_records,
          };
        });

  return (
    <DashboardLayout title="Importer" isLoading={importsLoading}>
      <MaterialTable
        columns={[
          {
            title: 'Import date',
            field: 'created_at',
            defaultSort: 'desc',
            render: rowData => {
              return (
                <div>
                  <Typography variant="body1">
                    {format(rowData.created_at_date, 'MMM d')}
                  </Typography>
                  <Typography variant="body2">
                    {format(rowData.created_at_date, 'h:mm aaa')}
                  </Typography>
                </div>
              );
            },
          },
          {
            title: 'Completed',
            render: rowData => {
              if (rowData.percent_complete === 0) {
                return (
                  <Typography variant="body1">
                    <em>Pending</em>
                  </Typography>
                );
              }

              if (rowData.completed) {
                return (
                  <div>
                    <Typography variant="body1">
                      {format(rowData.completed_date, 'MMM d')}
                    </Typography>
                    <Typography variant="body2">
                      {format(rowData.completed_date, 'h:mm aaa')}
                    </Typography>
                  </div>
                );
              }

              return <ImporterProgress id={rowData.id} />;
            },
          },
          { title: 'Imported by', field: 'creator' },
          { title: 'Records processed', field: 'total_records' },
          { title: 'Note', field: 'note', sorting: false },
          {
            title: 'ID',
            render: rowData => {
              return <Code>{rowData.id}</Code>;
            },
          },
          {
            title: 'Invalid rows',
            headerStyle: {
              textAlign: 'center',
            },
            sorting: false,
            render: rowData => {
              if (!rowData.error_doc) {
                return <div className={classes.downloadIconContainer}>-</div>;
              }

              return (
                <div className={classes.downloadIconContainer}>
                  <Tooltip
                    title={`Download CSV of ${rowData.invalid_records} invalid records`}
                    placement="top"
                  >
                    <CloudDownloadIcon
                      className={classes.downloadIcon}
                      onClick={() => handleInvalidDownload(rowData.id)}
                    />
                  </Tooltip>
                </div>
              );
            },
          },
        ]}
        data={cols}
        options={{
          pageSize: 10,
          search: false,
          headerStyle: {
            fontWeight: 'bold',
            backgroundColor: colors['table-header-gray'],
          },
        }}
        title={
          <TableHeader
            action="New import"
            href="/importer/create"
            title="Imports"
            startIcon={<Icon>add</Icon>}
          />
        }
      />
    </DashboardLayout>
  );
}

export default ImporterIndexPage;
