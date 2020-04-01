import { makeStyles } from '@material-ui/core';
import { colors } from '../../../styles/variables';
import qs from 'query-string';

const buildMap = props => {
  if (!props.latitude || !props.longitude) {
    return null;
  }

  const params = qs.stringify({
    center: `${props.latitude},${parseFloat(props.longitude) - 1}`,
    markers: `size:mid|${props.latitude}, ${props.longitude}`,
    key: process.env.GOOGLE_MAPS_KEY,
    zoom: 7,
    size: '800x150',
    scale: 2,
  });

  return `url(https://maps.googleapis.com/maps/api/staticmap?${params})`;
};

export default makeStyles(theme => ({
  root: {
    maxWidth: '800px',
  },
  profileHeader: {
    position: 'relative',
    borderBottom: `1px solid ${colors['color-gray-light']}`,
  },
  mapBg: props => ({
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    backgroundImage: buildMap(props),
    backgroundSize: 'cover',
    zIndex: 0,
  }),
  profileHeaderForeground: {
    position: 'relative',
    alignItems: 'center',
    display: 'flex',
    padding: theme.spacing(3),
    background:
      'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 45%, rgba(191,9,9,0) 100%)',
    zIndex: 1,
  },
  profileHeaderContent: {
    zIndex: 1,
  },
  profileHeaderAvatar: {
    marginRight: theme.spacing(2),
    marginBottom: theme.spacing(1),
    height: 96,
    width: 96,
  },
  userName: {
    textShadow: `0 0 1px ${colors['black-1']}`,
    fontWeight: 700,
  },
  profileSection: {
    padding: theme.spacing(3),
  },
  table: {
    width: '100%',
    '& td': {
      padding: theme.spacing(1, 2, 1, 0),
      fontSize: 16,
      verticalAlign: 'baseline',
    },
    '& tr > td:first-of-type': {
      paddingRight: theme.spacing(3),
      fontWeight: 'bold',
    },
  },
  pageViewTable: {
    '& tr': {
      borderBottom: `1px solid ${colors['color-gray-light']}`,
    },
    '& td': {
      padding: theme.spacing(0.5, 1, 0.5, 0),
      fontWeight: 'normal',
    },
    '& tr > td:first-of-type': {
      fontWeight: 'normal',
    },
  },
}));
