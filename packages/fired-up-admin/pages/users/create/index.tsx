import _get from 'lodash/get';
import { Formik, Field, FormikValues, FormikActions } from 'formik';
import { NextPage } from 'next';
import { submit as registerSignup } from 'fired-up-forms/src/library/forms';
import { TextField } from 'formik-material-ui';
import * as yup from 'yup';
import firebase from 'fired-up-core/src/library/firebase';
import pRetry from 'p-retry';
import React, { useState } from 'react';
import Router from 'next/router';

import DashboardLayout from '../../../layouts/Dashboard';

import { Button, Paper, makeStyles, FormControl } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3),
    maxWidth: '800px',
  },
  buttonProgress: {
    color: theme.palette.primary.main,
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
}));

async function fetchUserByEmail(email: string) {
  const firedupAdminGetUserID = firebase
    .functions()
    .httpsCallable('firedupAdminGetUserID');

  const user = await firedupAdminGetUserID({ email });
  if (!user.data) {
    throw new Error();
  }

  return user.data;
}

const UserCreatePage: NextPage = props => {
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(
    fields: FormikValues,
    formActions: FormikActions<FormikValues>
  ) {
    formActions.setSubmitting(true);
    setIsLoading(true);
    try {
      await registerSignup(fields, 'signup', '', ['create_firebase_user']);
      const user = await pRetry(
        async () => await fetchUserByEmail(fields.email_address),
        {
          retries: 10,
        }
      );
      formActions.setSubmitting(false);
      setIsLoading(false);
      Router.push(`/users/${user.uid}`);
    } catch (error) {
      console.log(error);
      formActions.setSubmitting(false);
      setIsLoading(false);
      setError(true);
    }
  }

  const validationSchemaShape = {
    given_name: yup.string().required('Required'),
    family_name: yup.string().required('Required'),
    email_address: yup
      .string()
      .email('Valid e-mail required')
      .required('Required'),
  };
  const validationSchema = yup.object().shape(validationSchemaShape);
  const classes = useStyles({});

  return (
    <DashboardLayout title="Create a user" isLoading={isLoading}>
      <Paper className={classes.root}>
        {error && <p>There was an error creating user</p>}
        <Formik
          initialValues={{
            given_name: '',
            family_name: '',
            email_address: '',
          }}
          onSubmit={handleSubmit}
          validationSchema={validationSchema}
          render={formProps => {
            return (
              <form onSubmit={formProps.handleSubmit}>
                <FormControl fullWidth={true} margin="none">
                  <Field
                    name="given_name"
                    label="First name"
                    fullWidth={true}
                    component={TextField}
                  />
                </FormControl>
                <FormControl fullWidth={true} margin="normal">
                  <Field
                    name="family_name"
                    label="Last name"
                    fullWidth={true}
                    component={TextField}
                  />
                </FormControl>
                <FormControl fullWidth={true} margin="normal">
                  <Field
                    name="email_address"
                    label="Email address"
                    fullWidth={true}
                    type="email"
                    component={TextField}
                  />
                </FormControl>
                <FormControl margin="normal">
                  <Button
                    color="secondary"
                    disabled={formProps.isSubmitting}
                    type="submit"
                    variant="contained"
                  >
                    {formProps.isSubmitting
                      ? 'Creating user'
                      : props.id
                      ? 'Save form'
                      : 'Create user'}
                  </Button>
                </FormControl>
              </form>
            );
          }}
        />
      </Paper>
    </DashboardLayout>
  );
};

export default UserCreatePage;
