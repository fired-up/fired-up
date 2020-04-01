import { connect, ConnectedProps } from 'react-redux';
import Auth, { AuthStateInterface } from 'fired-up-core/src/stores/auth';
import React, { useEffect } from 'react';

import { Container, Box, Typography, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { withStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Paper from '@material-ui/core/Paper';

import { colors } from '../../styles/variables';
import Router from 'next/router';
import { NextPage } from 'next';
import MetaProvider from '../../components/MetaProvider';

import config from '../../config.json';

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

const styles = () => ({
  '@global': {
    body: {
      backgroundImage: config.backgroundImage && `url('${config.backgroundImage}')`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center center',
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed',
      height: '100%',
    },
    html: {
      height: '100%',
    },
  },
});

type PropsFromRedux = ConnectedProps<typeof connector>;
type LoginPageProps = PropsFromRedux & {
  auth: AuthStateInterface;
};

const LoginPage: NextPage = (props: LoginPageProps) => {
  const classes = useStyles({});

  // get login status
  useEffect(() => {
    props.fetchStatus();
  }, []);

  // If logged in...
  useEffect(() => {
    if (
      props.auth.isLoggedIn &&
      props.auth.role === 'super-admin' &&
      props.auth.provider === 'google.com'
    ) {
      Router.push('/forms');
    }
  });

  const roles = ['super-admin'];

  if (!props.auth.hasCheckedAuth) {
    return null;
  }

  return (
    <>
      <CssBaseline />
      <MetaProvider
        meta={{
          noIndex: true,
          title: 'Login',
        }}
      />
      <Container maxWidth="xs" className={classes.container}>
        <Paper className={classes.paper}>
          <Box
            fontSize="h6.fontSize"
            color="#fff"
            fontWeight="bold"
            p={{
              xs: 2,
              sm: 3,
            }}
          >
            Please login to continue
          </Box>
          <Button
            color="primary"
            onClick={() => props.handleLogin()}
            variant="contained"
          >
            <Typography variant="button">Login with Google</Typography>
          </Button>
        </Paper>
      </Container>
    </>
  );
};

const mapState = state => ({
  auth: state.auth,
});

const mapDispatch = dispatch => ({
  fetchStatus: () => dispatch(Auth.status()),
  handleLogin: () => dispatch(Auth.login()),
});

const connector = connect(
  mapState,
  mapDispatch
);

export default connector(withStyles(styles)(LoginPage));
