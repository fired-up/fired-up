import _filter from 'lodash/filter';
import _find from 'lodash/find';
import _findIndex from 'lodash/findIndex';
import _isEmpty from 'lodash/isEmpty';
import _map from 'lodash/map';
import React, { useState, useMemo } from 'react';

import AutoFieldMapper from '../AutoFieldMapper';
import FieldMapperDialog from '../FieldMapperDialog';

import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import Typography from '@material-ui/core/Typography';

import { colors } from '../../../styles/variables';
import { green } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  fieldGroups: {
    display: 'grid',
    gridGap: theme.spacing(3),
    gridTemplateColumns: 'repeat(auto-fill,minmax(30%, 1fr))',
  },
  fieldGroup: {
    userSelect: 'none',
    '&:hover': {
      boxShadow: '0 0 0 0.2rem rgba(19, 34, 168, 0.25);',
      cursor: 'pointer',
    },
  },
  fieldGroupHeader: props => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1),
    backgroundColor: props.hasMatch ? green['400'] : colors['color-gray-light'],
  }),
  fieldGroupHeaderOriginal: props => ({
    ...(props.hasMatch && { color: 'white' }),
    fontWeight: 'bold',
  }),
  fieldGroupHeaderMatched: props => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0.5, 1),
    borderRadius: '3px',
    fontWeight: 'bold',
    fontSize: '0.825rem',
    backgroundColor: colors['color-gray-light'],
  }),
  fieldGroupContent: {
    padding: theme.spacing(1),
    borderBottom: `1px solid ${colors['color-gray-light']}`,
    '&:last-of-type': {
      borderBottom: 'none',
    },
  },
  fieldGroupContentText: {
    fontSize: '0.825rem',
  },
}));

interface FieldMapperProps {
  data: any[];
  onMapComplete: (map: Array<IMap>) => void;
}

export interface IMap {
  name: string;
  nice_name: string;
  match: string;
}

interface FieldMapperColProps {
  idx: number;
  data: Array<string>;
  map?: Array<IMap>;
  matchCol: (idx: number) => void;
}

const FieldMapperCol = (props: FieldMapperColProps) => {
  const header = props.data[0][props.idx];
  const match = _find(props.map, { match: header });
  const classes = useStyles({
    hasMatch: !!match,
  });

  /**
   * Since not all rows have data in every col, we want to get
   * a representative (read: useful) sample for the user.
   * We try to loop through all rows until we have enough data to display.
   * This could be an expensive operation (# cols) x (# rows) so memoizing seems to make sense
   */
  let filteredData = [];
  filteredData = useMemo(() => {
    let o = [];
    let i = 0;
    for (const item of props.data.slice(1, props.data.length - 1)) {
      if (i < 6 && item[props.idx]) {
        i++;
        o.push(item[props.idx]);
      }
    }

    return o;
  }, [props.data]);

  // If the column had no preview data, there's nothing to import and therefore no reason to show this field as available for mapping
  if (_isEmpty(filteredData)) {
    return null;
  }

  return (
    <Card
      className={classes.fieldGroup}
      onClick={() => props.matchCol(props.idx)}
    >
      <div className={classes.fieldGroupHeader}>
        <Typography
          className={classes.fieldGroupHeaderOriginal}
          variant="body1"
        >
          {header}
        </Typography>
        {match && (
          <Typography
            className={classes.fieldGroupHeaderMatched}
            variant="body1"
          >
            {match.nice_name}
          </Typography>
        )}
      </div>
      {filteredData.map((item, idx) => {
        return (
          <div className={classes.fieldGroupContent} key={idx}>
            <Typography
              className={classes.fieldGroupContentText}
              variant="body1"
            >
              {item}
            </Typography>
          </div>
        );
      })}
    </Card>
  );
};

const FieldMapper = (props: FieldMapperProps) => {
  const classes = useStyles({});
  const [map, setMap] = useState<Array<IMap>>([]);

  // Used to trigger matching dialog
  const [matchingIndex, setMatchingIndex] = useState(null);

  function handleNext() {
    props.onMapComplete(map);
  }

  // On dialog close, update map if `inc` (incoming value) is provided
  function handleMapDialogClose(inc: IMap) {
    if (!inc) {
      return setMatchingIndex(null);
    }

    let o = [...map];

    // Single field is updating its own value
    const incIdx = _findIndex(map, { match: inc.match });
    const collisionIdx = _findIndex(map, { name: inc.name });
    if (incIdx > -1) {
      o[incIdx] = inc;
    } else {
      o.push(inc);
    }

    // If a value gets taken from another box, there's a "collision".
    if (collisionIdx > -1 && collisionIdx !== incIdx) {
      o.splice(collisionIdx, 1);
    }

    setMap(o);
    setMatchingIndex(null);
  }

  // Determines if we can proceed to next step
  const canProceed = (): boolean => {
    return !!_find(map, { name: 'email_address' });
  };

  return (
    <div>
      <AutoFieldMapper
        data={props.data}
        handleClose={map => {
          setMap(map);
        }}
      />
      <div className={classes.sectionHeader}>
        <div>
          <Typography variant="h6">Select column(s) to import:</Typography>
          <Typography variant="body2">
            Email is the only required column:
          </Typography>
        </div>
        <Button
          color="secondary"
          disabled={!canProceed()}
          endIcon={<NavigateNextIcon />}
          onClick={handleNext}
          variant="contained"
        >
          Next
        </Button>
      </div>
      <div className={classes.fieldGroups}>
        {props.data[0].map((_header, idx) => (
          <FieldMapperCol
            data={props.data.slice(0, 8)}
            idx={idx}
            map={map}
            matchCol={setMatchingIndex}
            key={idx}
          />
        ))}
      </div>
      <FieldMapperDialog
        data={props.data}
        handleCloseDialog={handleMapDialogClose}
        map={map}
        matchingIndex={matchingIndex}
      />
    </div>
  );
};

export default FieldMapper;
