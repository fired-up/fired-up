import _get from 'lodash/get';
import { connect, ConnectedProps } from 'react-redux';
import Link from 'next/link';
import React, { useEffect } from 'react';

import { Container, Paper, Box, Typography } from '@material-ui/core';
import Auth from 'fired-up-core/src/stores/auth';

const ErrorPage = props => {
  useEffect(() => {
    props.fetchStatus();
  }, []);

  return (
    <Container maxWidth="md">
      <Box marginTop={5}>
        <Paper>
          <Box padding={(3, 5)} textAlign="center">
            <Typography>An unexpected error has occurred.</Typography>
            {props.isLoggedIn && (
              <Typography>
                <Link href="/forms">
                  <a>Return to dashboard</a>
                </Link>
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

const mapDispatch = dispatch => ({
  fetchStatus: () => dispatch(Auth.status()),
});

const mapState = state => ({
  isLoggedIn: _get(state, 'auth.isLoggedIn', null),
});

const connector = connect(
  mapState,
  mapDispatch
);

export default connector(ErrorPage);
