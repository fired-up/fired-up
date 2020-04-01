import Link from 'next/link';
import React from 'react';

import { makeStyles } from '@material-ui/core/styles';

import Typography from '@material-ui/core/Typography';

import { colors } from '../../../styles/variables';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3),
    marginTop: theme.spacing(3),
    marginRight: 'auto',
    marginLeft: 'auto',
    textAlign: 'center',
    backgroundColor: colors['color-gray-extra-light'],
    borderRadius: '3px',
    maxWidth: '500px',
  },
  percentage: {
    fontSize: theme.typography.pxToRem(64),
    color: colors.secondary.main,
    fontWeight: 'bold',
  },
}));

interface ImporterUploadWidgetProps {
  importComplete: boolean;
  percentComplete: number;
}

const ImporterUploadWidget = (props: ImporterUploadWidgetProps) => {
  const classes = useStyles({});

  function renderProgress() {
    return (
      <div>
        <Typography variant="body1">Uploading...</Typography>
        <Typography className={classes.percentage}>
          {props.percentComplete && props.percentComplete.toFixed(1)}%
        </Typography>
        <Typography variant="body2">Do not close this window</Typography>
      </div>
    );
  }

  function renderComplete() {
    return (
      <Typography variant="body1">
        Upload success! Your import is now in progress. You can check the status
        on the{' '}
        <Link href="/importer">
          <a>dashboard</a>
        </Link>
      </Typography>
    );
  }

  return (
    <div className={classes.root}>
      {props.importComplete ? renderComplete() : renderProgress()}
    </div>
  );
};

export default ImporterUploadWidget;
