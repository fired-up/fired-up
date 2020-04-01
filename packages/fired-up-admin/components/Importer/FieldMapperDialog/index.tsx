import React, { useState } from 'react';
import _find from 'lodash/find';

import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import IconButton from '@material-ui/core/IconButton';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Typography from '@material-ui/core/Typography';

import { IMap } from '../FieldMapper';
import { makeStyles } from '@material-ui/core/styles';
import cols from '../cols';
import { pickColFields } from '../utils';

const useStyles = makeStyles(theme => ({
  root: {},
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
  mapperSelectForm: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    maxWidth: '75%',
  },
  collisionWarning: {
    marginTop: theme.spacing(1),
    fontSize: '14px',
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
}));

interface FieldMapperDialogProps {
  data: Array<any>;
  handleCloseDialog: (map?: IMap) => void;
  map: Array<IMap>;
  matchingIndex: number;
}

const FieldMapperDialog = (props: FieldMapperDialogProps) => {
  const classes = useStyles({});
  const [selectedMatch, setSelectedMatch] = useState('');
  const matchCol = props.data[0][props.matchingIndex];

  /**
   * On dialog close, we create an object that can be merged into the master map
   */
  function handleClose() {
    const col = _find(cols, { name: selectedMatch });
    const picked = pickColFields(col);
    const map = Object.assign({}, picked, { match: matchCol });
    setSelectedMatch('');
    props.handleCloseDialog(map);
  }

  if (props.matchingIndex === null) {
    return null;
  }

  // Show collision info, if necessary
  function renderCollisionInfo() {
    const collision = _find(props.map, { name: selectedMatch });

    // If there's no collision or the field is the same, no warning is necessary
    if (!collision || collision.name === selectedMatch) {
      return null;
    }

    return (
      <Typography className={classes.collisionWarning} variant="body2">
        {collision.nice_name} is already matched to column{' '}
        <em>{collision.match}</em>. Selecting this field will overwrite the
        previous selection.
      </Typography>
    );
  }

  return (
    <Dialog
      fullWidth={true}
      onClose={() => null}
      open={props.matchingIndex !== null}
    >
      <DialogTitle disableTypography className={classes.root}>
        <Typography variant="h6">
          Match <strong>{matchCol}</strong>
        </Typography>
        <IconButton
          aria-label="close"
          className={classes.closeButton}
          onClick={() => props.handleCloseDialog()}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1">
          Select value to map to column <strong>{matchCol}</strong>:
        </Typography>
        <FormControl className={classes.mapperSelectForm} fullWidth={true}>
          {/* <InputLabel id="filter-select-label">Filter results</InputLabel> */}
          <Select
            id="filter-select"
            labelId="filter-select-label"
            onChange={e => setSelectedMatch(e.target.value)}
            value={selectedMatch}
          >
            {cols.map((col, idx) => (
              <MenuItem key={idx} value={col.name}>
                {col.nice_name}
              </MenuItem>
            ))}
          </Select>
          {renderCollisionInfo()}
        </FormControl>
      </DialogContent>
      <DialogContent className={classes.buttons}>
        <Button color="secondary" onClick={handleClose} variant="contained">
          Confirm
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default FieldMapperDialog;
