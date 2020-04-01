import { connect, ConnectedProps } from 'react-redux';
import Auth from 'fired-up-core/src/stores/auth';
import React, { ReactChildren, useEffect } from 'react';

import { makeStyles } from '@material-ui/core/styles';

import { colors } from '../../styles/variables';
import Router from 'next/router';

const useStyles = makeStyles(theme => ({
  container: {
    marginTop: theme.spacing(20),
    textAlign: 'center',
  },
  paper: {
    padding: theme.spacing(5, 3),
    backgroundColor: colors.blue,
  },
  logo: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    textAlign: 'center',
  },
}));

type PropsFromRedux = ConnectedProps<typeof connector>;
type AuthWallProps = PropsFromRedux & {
  auth: any;
  children: ReactChildren;
  roles: [string];
};

function AuthWall(props: AuthWallProps) {
  const classes = useStyles({});

  /**
   * @todo: This can be moved up to props, if needed
   */
  const roles = ['super-admin'];
  const isSuperAdmin = () => {
    return (
      props.auth.isLoggedIn &&
      roles.indexOf(props.auth.role) !== -1 &&
      props.auth.provider === 'google.com'
    );
  };

  async function handleLogin() {
    try {
      const user = await props.dispatch(Auth.login());
      props.dispatch(Auth.authElevationListener(user));
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    if (!props.auth.hasCheckedAuth) {
      return;
    }

    if (!props.auth.isLoggedIn || !isSuperAdmin()) {
      Router.push('/login');
    }
  }, [props.auth.hasCheckedAuth, props.auth.isLoggedIn]);

  if (isSuperAdmin()) {
    return props.children;
  }

  if (!props.auth.hasCheckedAuth || !isSuperAdmin()) {
    return null;
  }
}

const mapState = state => ({
  auth: state.auth,
});

const connector = connect(mapState);

export default connector(AuthWall);
