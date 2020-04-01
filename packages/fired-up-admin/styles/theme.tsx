import { createMuiTheme } from '@material-ui/core/styles';

import { colors, fonts } from './variables';
import { green, orange, red } from '@material-ui/core/colors';

// Create a theme instance.
const theme = createMuiTheme({
  palette: {
    primary: {
      light: '#ff8d66',
      main: '#f05b3a',
      dark: '#b7260f',
      contrastText: '#fff',
    },

    // Blue
    secondary: {
      light: '#5b4cdb',
      main: '#1322a8',
      dark: '#000078',
      contrastText: '#fff',
    },
    error: {
      main: red[500],
    },
    warning: {
      main: orange[500],
    },
    success: {
      main: green[500],
    },
  },
  typography: {
    button: {
      fontFamily: fonts.sansSerif,
      fontWeight: 700,
    },
  },
  overrides: {
    MuiLink: {
      root: {
        color: '#1259A0',
      },
    },
    MuiFormLabel: {
      root: {
        '&$focused': {
          color: colors['black-1'],
        },
      },
    },
  },
});

export default theme;
