import { darken } from 'polished';

import { makeStyles } from '@material-ui/core/styles';

import { colors } from '../../../styles/variables';

export default makeStyles(theme => ({
  valid: {
    fontSize: 14,
    color: theme.palette.success.main,
  },
  warning: {
    fontSize: 14,
    color: theme.palette.warning.main,
  },
  error: {
    fontSize: 14,
    color: theme.palette.error.main,
  },
  root: {
    marginRight: 'auto',
    marginLeft: 'auto',
    maxWidth: '500px',
  },
  tableHeadCell: {
    padding: theme.spacing(1),
    fontWeight: 'bold',
    borderBottom: '2px solid rgba(224, 224, 224, 1)',
  },
  tableGroup: {
    marginBottom: theme.spacing(5),
    '& table': {
      padding: theme.spacing(2),
      backgroundColor: colors['color-gray-extra-light'],
      borderRadius: '3px',
    },
    '&:last-of-type': {
      marginBottom: 0,
    },
    '& tr:last-child td': {
      borderBottom: 'none',
    },
    '& td': {
      padding: theme.spacing(1),
    },
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  confirmTable: {
    marginRight: 'auto',
    marginLeft: 'auto',
    maxWidth: '500px',
  },
  note: {
    padding: theme.spacing(1),
    backgroundColor: colors['color-gray-extra-light'],
    borderRadius: '3px',
  },
  tableKey: {
    padding: theme.spacing(1),
    backgroundColor: colors['color-gray-light'],
    borderTop: `2px solid ${darken(0.1, colors['color-gray-light'])}`,
  },
  tableKeyHeader: {
    marginBottom: theme.spacing(1),
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableKeyRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
    '& > svg': {
      marginRight: theme.spacing(1),
    },
    '&:last-of-type': {
      marginBottom: '0',
    },
  },
  tableKeyRowDescription: {
    fontSize: 12,
  },
  errorMessage: {
    marginTop: theme.spacing(0.5),
    fontSize: 12,
    color: theme.palette.error.main,
    textAlign: 'right',
  },
}));
