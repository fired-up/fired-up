import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import _indexOf from 'lodash/indexOf';
import _isEmpty from 'lodash/isEmpty';
import _map from 'lodash/map';
import React, { useState, useEffect } from 'react';

import Button from '@material-ui/core/Button';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import WarningIcon from '@material-ui/icons/Warning';

import ValidatedMatchRow from '../ValidatedMatchRow';

import { IMap } from '../FieldMapper';
import { utms, tasks } from '../ImporterSettings';

import useStyles from './style';

interface MapConfirmationProps {
  data: Array<Array<string>>;
  map: Array<IMap>;
  onConfirm: () => void;
  settings: {
    formSettings: object;
    note: string;
    utm: object;
  };
  totalRecords: number;
}

const MapConfirmation = (props: MapConfirmationProps) => {
  const classes = useStyles({});
  const [isInvalid, setIsInvalid] = useState(false);
  const noHeaderData = props.data ? props.data.slice(1, props.data.length) : [];

  return (
    <div>
      <div className={classes.sectionHeader}>
        <Typography variant="h6">Confirm mapping:</Typography>
        <div>
          <Button
            color="secondary"
            disabled={isInvalid}
            endIcon={<NavigateNextIcon />}
            onClick={props.onConfirm}
            variant="contained"
          >
            {`Confirm and upload ${props.totalRecords.toLocaleString()} records`}
          </Button>
          {isInvalid && (
            <Typography className={classes.errorMessage}>
              Unable to submit with invalid dataset
            </Typography>
          )}
        </div>
      </div>

      <div className={classes.root}>
        <div className={classes.tableGroup}>
          <Typography variant="h6">Field mappings</Typography>
          <Table className={classes.confirmTable}>
            <TableHead>
              <TableRow>
                <TableCell className={classes.tableHeadCell}>Column</TableCell>
                <TableCell className={classes.tableHeadCell}>
                  Matched from CSV column
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {_map(props.map, (item, idx) => {
                const columnIndex = _indexOf(props.data[0], item.match);
                return (
                  <ValidatedMatchRow
                    columnIndex={columnIndex}
                    data={noHeaderData}
                    handleInvalidData={() => setIsInvalid(true)}
                    key={idx}
                    mapItem={item}
                  />
                );
              })}
            </TableBody>
          </Table>
          <div className={classes.tableKey}>
            <div className={classes.tableKeyRow}>
              <CheckCircleIcon className={classes.valid} />
              <Typography className={classes.tableKeyRowDescription}>
                All rows validated successfully for this field
              </Typography>
            </div>
            <div className={classes.tableKeyRow}>
              <WarningIcon className={classes.warning} />
              <Typography className={classes.tableKeyRowDescription}>
                Some rows contain errors. Invalid rows will not be imported.
              </Typography>
            </div>
            <div className={classes.tableKeyRow}>
              <ErrorIcon className={classes.error} />
              <Typography className={classes.tableKeyRowDescription}>
                Invalid mapping for this field
              </Typography>
            </div>
          </div>
        </div>

        <div className={classes.tableGroup}>
          <Typography variant="h6">UTM Parameters</Typography>
          {_isEmpty(props.settings.utm) ? (
            <Typography className={classes.note} variant="body2">
              None specified
            </Typography>
          ) : (
            <Table className={classes.confirmTable}>
              <TableBody>
                {_map(props.settings.utm, (item, key) => {
                  const nicename = _find(utms, { name: key })['nice_name'];

                  return (
                    <TableRow key={key}>
                      <TableCell>{nicename}</TableCell>
                      <TableCell>{item}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <div className={classes.tableGroup}>
          <Typography variant="h6">Additional settings</Typography>
          {_isEmpty(props.settings.formSettings) ? (
            <Typography className={classes.note} variant="body2">
              None specified
            </Typography>
          ) : (
            <Table className={classes.confirmTable}>
              <TableBody>
                {_map(props.settings.formSettings, (item, key) => {
                  const nicename = _find(tasks, { name: key })['nice_name'];

                  return (
                    <TableRow key={key}>
                      <TableCell>{nicename}</TableCell>
                      <TableCell>{item}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {props.settings.note && (
          <div className={classes.tableGroup}>
            <Typography variant="h6">Import description</Typography>
            <Typography className={classes.note} variant="body2">
              {props.settings.note}
            </Typography>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapConfirmation;
