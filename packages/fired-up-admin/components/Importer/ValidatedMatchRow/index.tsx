import _forEach from 'lodash/forEach';
import _find from 'lodash/find';
import React, { useState, useMemo, useEffect } from 'react';

import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import LoopIcon from '@material-ui/icons/Loop';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip';
import WarningIcon from '@material-ui/icons/Warning';

import { makeStyles } from '@material-ui/core/styles';

import cols from '../cols';
import { IMap } from '../FieldMapper';

import ValidationWorker from './validation.worker';

const useStyles = makeStyles(theme => ({
  valid: {
    color: theme.palette.success.main,
  },
  warning: {
    color: theme.palette.warning.main,
  },
  error: {
    color: theme.palette.error.main,
  },
  cellheader: {
    display: 'flex',
    alignItems: 'center',
    '& > svg': {
      marginRight: theme.spacing(1),
    },
  },
}));

interface ValidatedMatchRowProps {
  columnIndex: number;
  data: Array<Array<string>>;
  handleInvalidData: () => void;
  mapItem: IMap;
}

const ValidatedMatchRow = (props: ValidatedMatchRowProps) => {
  const classes = useStyles({});
  const colData = _find(cols, { name: props.mapItem.name });
  const [hasValidated, setHasValidated] = useState(false);
  const [validity, setValidity] = useState({
    isValid: true,
    numErrors: 0,
  });

  let worker;

  useEffect(() => {
    if (!colData.validation) {
      setHasValidated(true);
    } else {
      worker = new ValidationWorker();
      worker.addEventListener('message', onWorkerMessage);
      worker.postMessage({
        columnIndex: props.columnIndex,
        csv: props.data,
        mapItem: props.mapItem,
      });
    }
  }, []);

  function onWorkerMessage(e: MessageEvent) {
    if (e.data.type === 'validity') {
      if (!e.data.body.isValid) {
        setValidity({
          isValid: false,
          numErrors: e.data.body.numErrors,
        });
      }

      setHasValidated(true);
    }
  }

  function renderValidation() {
    const iconStyle = {
      fontSize: 14,
    };

    if (!hasValidated) {
      return <LoopIcon style={iconStyle} />;
    }

    if (validity.isValid) {
      return (
        <Tooltip title="Row successfully validated">
          <CheckCircleIcon className={classes.valid} style={iconStyle} />
        </Tooltip>
      );
    }

    // Handle invalid cases:
    // everything is invalid
    if (validity.numErrors === props.data.length) {
      props.handleInvalidData();

      return (
        <Tooltip title="0 rows validated. Check your mapping.">
          <ErrorIcon className={classes.error} style={iconStyle} />
        </Tooltip>
      );
    }

    // some things are invalid, note that they will be pruned
    return (
      <Tooltip
        title={`${validity.numErrors} row(s) contain invalid data. Invalid rows will not be imported.`}
      >
        <WarningIcon className={classes.warning} style={iconStyle} />
      </Tooltip>
    );
  }

  return (
    <TableRow>
      <TableCell>
        <span className={classes.cellheader}>
          {renderValidation()} {props.mapItem.nice_name}
        </span>
      </TableCell>
      <TableCell>{props.mapItem.match}</TableCell>
    </TableRow>
  );
};

export default ValidatedMatchRow;
