import { useDropzone } from 'react-dropzone';
import cx from 'classnames';
import React, { useCallback, useState } from 'react';

import { darken } from 'polished';

import CloseIcon from '@material-ui/icons/Close';
import ErrorIcon from '@material-ui/icons/Error';
import IconButton from '@material-ui/core/IconButton';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import Typography from '@material-ui/core/Typography';

import { makeStyles } from '@material-ui/core/styles';
import { colors } from '../../styles/variables';

interface StyleProps {
  isDragActive: boolean;
}

const useStyles = makeStyles(theme => ({
  container: ({ isDragActive }: StyleProps) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(5),
    backgroundColor: isDragActive
      ? darken(0.1, colors['color-gray-light'])
      : colors['color-gray-light'],
    textAlign: 'center',
    transitionProperty: 'background-color',
    transitionDuration: '0.15s',
    userSelect: 'none',
    '&:hover': {
      cursor: 'pointer',
    },
    borderRadius: '5px',
  }),
  icon: {
    fontSize: 20,
  },
  iconVariant: {
    opacity: 0.9,
    marginRight: theme.spacing(1),
  },
  message: {
    display: 'flex',
    alignItems: 'center',
  },
  error: {
    backgroundColor: theme.palette.error.dark,
  },
}));

function MyDropzone(props) {
  const [isAlertOpen, setAlertOpen] = useState(false);

  const onDrop = useCallback(acceptedFiles => {
    if (
      acceptedFiles.length > 1 ||
      acceptedFiles[0].type.indexOf('text/csv') === -1
    ) {
      return setAlertOpen(true);
    }

    props.onDrop(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
  const classes = useStyles({ isDragActive });

  return (
    <div {...getRootProps()} className={classes.container}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <Typography variant="body1">Drop the CSV here ...</Typography>
      ) : (
        <Typography variant="body1">
          Drop your CSV here, or click to select files
        </Typography>
      )}
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={3500}
        onClose={() => setAlertOpen(false)}
        open={isAlertOpen}
        ContentProps={{
          'aria-describedby': 'message-id',
        }}
      >
        <SnackbarContent
          className={classes.error}
          message={
            <span id="client-snackbar" className={classes.message}>
              <ErrorIcon className={cx(classes.icon, classes.iconVariant)} />
              Invalid file type
            </span>
          }
          action={[
            <IconButton
              key="close"
              aria-label="close"
              color="inherit"
              onClick={() => setAlertOpen(false)}
            >
              <CloseIcon className={classes.icon} />
            </IconButton>,
          ]}
        />
      </Snackbar>
    </div>
  );
}

export default MyDropzone;
