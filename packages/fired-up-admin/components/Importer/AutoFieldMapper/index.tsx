import _find from 'lodash/find';
import _pick from 'lodash/pick';
import React, { useEffect, useState } from 'react';

import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';

import Code from '../../Code';

import { IMap } from '../FieldMapper';
import { makeStyles } from '@material-ui/core';
import cols from '../cols';
import { pickColFields } from '../utils';

interface AutoFieldMapperProps {
  data: Array<Array<string>>;
  handleClose: (mapping?: Array<IMap>) => void;
}

const useStyles = makeStyles(theme => ({
  root: {
    margin: 0,
    padding: theme.spacing(1.5, 3),
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
  match: {
    overflow: 'hidden',
    '& > *': {
      marginRight: theme.spacing(1),
      float: 'left',
    },
  },
  noticeText: {
    marginBottom: theme.spacing(1),
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  buttonWithMargin: {
    marginRight: theme.spacing(1),
  },
  cellName: {
    paddingLeft: 0,
    width: '25%',
  },
  cellMatch: {},
  matchTable: {
    '& tr:last-of-type td': {
      paddingBottom: 0,
      borderBottom: 'none',
    },
    '& td': {
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1),
    },
  },
}));

/**
 * When component loads, we loop through CSV headers and see if we can auto-match
 * any of them to columns we know. eg. if there was a header called `email_address`,
 * we'd automatically map it to email_address
 */
function handleLoad(headers) {
  const matches = [];
  for (const header of headers) {
    const m = _find(cols, { name: header });
    const picked = pickColFields(m);

    if (m) {
      matches.push(
        Object.assign({}, picked, {
          match: header,
        })
      );
    }
  }

  return matches;
}

const AutoFieldMapper = (props: AutoFieldMapperProps) => {
  const classes = useStyles({});
  const [matches, setMatches] = useState<Array<IMap>>([]);
  const [isVisible, setIsVisible] = useState(false);

  /**
   * note: if we decide we want this component to actually render,
   * we can uncomment the lines below
   */
  useEffect(() => {
    const csvHeaders = handleLoad(props.data[0]);
    if (csvHeaders.length) {
      // setIsVisible(true);
      // setMatches(m);
      props.handleClose(csvHeaders);
    }
  }, []);

  function handleClose(useSuggestions: boolean) {
    const suggestedMatches = useSuggestions ? matches : null;
    setIsVisible(false);
    props.handleClose(suggestedMatches);
  }

  if (!isVisible) {
    return null;
  }

  return (
    <Dialog fullWidth={true} onClose={() => null} open={isVisible}>
      <DialogTitle disableTypography className={classes.root}>
        <Typography variant="h6">Notice</Typography>
        <IconButton
          aria-label="close"
          className={classes.closeButton}
          onClick={() => setIsVisible(false)}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <div className={classes.noticeText}>
          <Typography variant="body1">
            We were able to match some columns for you.
          </Typography>
          <Typography variant="body1">
            Do you want to use these matches (you'll be able to add more) or
            create your own matches?
          </Typography>
        </div>
        <Table className={classes.matchTable}>
          <TableBody>
            {matches.map((match, idx) => {
              return (
                <TableRow key={idx}>
                  <TableCell className={classes.cellName}>
                    <Typography
                      className={classes.match}
                      key={idx}
                      variant="body2"
                    >
                      <strong>{match.nice_name}</strong>
                    </Typography>
                  </TableCell>
                  <TableCell className={classes.cellMatch}>
                    <Code>{match.match}</Code>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogContent className={classes.buttons}>
        <Button
          onClick={() => handleClose(false)}
          className={classes.buttonWithMargin}
          variant="contained"
          color="primary"
        >
          I'll set my own
        </Button>
        <Button
          onClick={() => handleClose(true)}
          variant="contained"
          color="secondary"
        >
          Use suggestions
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AutoFieldMapper;
