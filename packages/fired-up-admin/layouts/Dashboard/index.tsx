import _get from 'lodash/get';
import { connect, ConnectedProps } from 'react-redux';
import { NextPageContext } from 'next';
import cx from 'classnames';
import Helmet from 'react-helmet';
import Link from 'next/link';
import React, { useEffect, ReactNode, useState } from 'react';
import Router from 'next/router';

import { fade, makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import CloseIcon from '@material-ui/icons/Close';
import Container from '@material-ui/core/Container';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import ErrorIcon from '@material-ui/icons/Error';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import IconButton from '@material-ui/core/IconButton';
import InputBase from '@material-ui/core/InputBase';
import LinearProgress from '@material-ui/core/LinearProgress';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import SearchIcon from '@material-ui/icons/Search';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import Auth from 'fired-up-core/src/stores/auth';
import LoginWall from '../../components/LoginWall';
import MetaProvider from '../../components/MetaProvider';
import navigation from './navigation';
import findUser from '../../components/UserLookup/library';

type PropsFromRedux = ConnectedProps<typeof connector>;
type LayoutAdminProps = PropsFromRedux & {
  children: ReactNode;
  header?: React.Component;

  // Used to show a loading bar at the top of the screen
  isLoading?: boolean;

  // should not be used with `isLoading`. Pass a number 0-100 to denote progress. Will render a progress bar
  progress?: number;

  // Page title
  title?: string;
};

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexGrow: 1,
  },
  title: {
    flexGrow: 1,
    display: 'none',
    [theme.breakpoints.up('sm')]: {
      display: 'block',
    },
  },
  appBar: {
    backgroundColor: theme.palette.secondary.main,
    zIndex: theme.zIndex.drawer + 1,
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    backgroundColor: '#fafafa',
    minHeight: '100vh',
  },
  toolbar: theme.mixins.toolbar,
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(1),
      width: 'auto',
    },
  },
  searchIcon: {
    width: theme.spacing(7),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRoot: {
    color: 'inherit',
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 7),
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: 180,
      '&:focus': {
        width: 250,
      },
    },
  },
  grow: {
    flexGrow: 1,
  },
  logout: {
    marginTop: 'auto',
  },
  navigationList: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  },
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

function LayoutAdmin(props: LayoutAdminProps) {
  const classes = useStyles(props);
  const [isSearching, setSearching] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    props.fetchStatus();
  }, []);

  async function handleUserLookup(e: KeyboardEvent) {
    if ((e.key && e.key === 'Enter') || (e.keyCode && e.keyCode === 13)) {
      const target = e.target as HTMLTextAreaElement;
      if (!target.value) {
        return;
      }

      try {
        setSearching(true);
        const res = await findUser(target.value);
        if (!res) {
          setAlertOpen(true);
        } else {
          Router.push(`/users/${res.uid}`);
        }
        setSearching(false);
      } catch (err) {
        console.log(err);
        setSearching(false);
      }
    }
  }

  return (
    <>
      <MetaProvider
        meta={{
          noIndex: true,
          title: props.title || 'Admin',
        }}
      />
      <LoginWall>
        <div className={classes.root}>
          <AppBar position="fixed" className={classes.appBar}>
            <Toolbar>
              <Typography className={classes.title} noWrap>
                Fired Up Admin
              </Typography>
              <div className={classes.search}>
                <div className={classes.searchIcon}>
                  <SearchIcon />
                </div>
                <InputBase
                  error={true}
                  placeholder="Find user by email…"
                  onKeyUp={handleUserLookup}
                  onClick={() => setSearchValue('')}
                  classes={{
                    root: classes.inputRoot,
                    input: classes.inputInput,
                  }}
                  inputProps={{ 'aria-label': 'search' }}
                  onChange={e => setSearchValue(e.target.value)}
                  value={searchValue}
                />
              </div>
            </Toolbar>
            {(props.isLoading || isSearching) && (
              <LinearProgress color="primary" />
            )}
            {props.progress && (
              <LinearProgress
                variant="determinate"
                color="primary"
                value={props.progress}
              />
            )}
          </AppBar>
          <Drawer
            className={classes.drawer}
            variant="permanent"
            classes={{
              paper: classes.drawerPaper,
            }}
          >
            <div className={classes.toolbar} />
            <List className={classes.navigationList}>
              {navigation.map((item, index) => {
                return (
                  <React.Fragment key={index}>
                    <Link href={item.path} key={item.title}>
                      <ListItem button>
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.title} />
                      </ListItem>
                    </Link>
                    <Divider />
                  </React.Fragment>
                );
              })}
              <div className={classes.logout}>
                <Divider />
                <ListItem
                  button
                  onClick={() => {
                    props.logout();
                    Router.push('/login');
                  }}
                >
                  <ListItemIcon>
                    <ExitToAppIcon />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItem>
              </div>
            </List>
          </Drawer>
          <div className={classes.content}>
            <Container maxWidth="xl">
              <div className={classes.toolbar} />
              {props.children}
            </Container>
          </div>
        </div>
        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          autoHideDuration={5000}
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
                {`"${searchValue}" not found`}
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
      </LoginWall>
    </>
  );
}

LayoutAdmin.getInitialProps = async ({ req }: NextPageContext) => {
  if (req) {
    Helmet.renderStatic();
  }

  return {};
};

const mapState = state => ({
  uid: _get(state, 'auth.user.uid', ''),
});

const mapDispatch = dispatch => ({
  fetchStatus: () => dispatch(Auth.status()),
  logout: () => dispatch(Auth.logout()),
});

const connector = connect(
  mapState,
  mapDispatch
);

export default connector(LayoutAdmin);
