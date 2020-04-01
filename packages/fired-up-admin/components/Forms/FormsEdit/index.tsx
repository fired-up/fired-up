import _clone from 'lodash/clone';
import _map from 'lodash/map';
import _get from 'lodash/get';
import { connect, ConnectedProps } from 'react-redux';
import { Formik, Field, FormikValues, FormikActions } from 'formik';
import { CheckboxWithLabel, TextField } from 'formik-material-ui';
import React, { useState, useEffect } from 'react';
import Router from 'next/router';
import * as yup from 'yup';

import forms from '../stores';

import {
  Button,
  Paper,
  makeStyles,
  FormControl,
  Box,
  Typography,
} from '@material-ui/core';
import Code from '../../Code';

type PropsFromRedux = ConnectedProps<typeof connector>;
type FormsEditProps = PropsFromRedux & {
  id?: string;
};

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3),
    maxWidth: '800px',
  },
}));

function FormsEdit(props: FormsEditProps) {
  const [isReady, setReady] = useState(false);
  const [error] = useState('');
  const classes = useStyles({});

  useEffect(() => {
    if (!props.id) {
      return setReady(true);
    } else {
      props.getForms();
    }
  }, []);

  // Listen for updates to forms
  useEffect(() => {
    setReady(true);
  }, [props.adminForms]);

  /**
   * After form submit
   * - reset redux state
   * - redirect user to all forms
   */
  useEffect(() => {
    if (props.writeComplete) {
      props.resetFormWriteStatus();
      Router.push('/forms');
    }
  }, [props.writeComplete]);

  async function handleSubmit(
    fields: FormikValues,
    formUtils: FormikActions<FormikValues>
  ) {
    formUtils.setSubmitting(true);
    props.writeForm(fields, props.id);
  }

  if (!isReady) {
    return null;
  }

  const initialValues = props.id
    ? props.adminForms[props.id]
    : {
        name: '',
        description: '',
        sendgrid_optin_optional: false,
      };

  const validationSchemaShape = {
    name: yup.string().required('Required'),
    description: yup.string().required('Required'),
  };
  const validationSchema = yup.object().shape(validationSchemaShape);

  if (props.id && !props.adminForms[props.id]) {
    return <Paper className={classes.root} />;
  }

  return (
    <Paper className={classes.root}>
      {error && <p>{error}</p>}
      <Formik
        enableReinitialize={true}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validationSchema={validationSchema}
        render={formProps => {
          return (
            <form onSubmit={formProps.handleSubmit}>
              {props.id && (
                <FormControl fullWidth={true} margin="none">
                  <Box display="flex" alignItems="center">
                    <Typography variant="h6">Editing form</Typography>
                    <Box marginLeft={1}>
                      <Typography variant="h6">
                        <Code>{props.id}</Code>
                      </Typography>
                    </Box>
                  </Box>
                </FormControl>
              )}
              <FormControl
                fullWidth={true}
                margin={props.id ? 'normal' : 'none'}
              >
                <Field
                  name="name"
                  label="Form name"
                  fullWidth={true}
                  type="textarea"
                  component={TextField}
                />
              </FormControl>
              <FormControl fullWidth={true} margin="normal">
                <Field
                  name="description"
                  type="textarea"
                  fullWidth={true}
                  label="Description"
                  component={TextField}
                />
              </FormControl>

              <div className="row">
                <div className="col-7">
                  <div className="form-group button-group">
                    <Button
                      color="secondary"
                      type="submit"
                      variant="contained"
                      disabled={formProps.isSubmitting}
                    >
                      {formProps.isSubmitting
                        ? 'Working...'
                        : props.id
                        ? 'Save form'
                        : 'Create form'}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          );
        }}
      />
    </Paper>
  );
}

const mapState = state => ({
  adminForms: _get(state, 'adminForms.forms'),
  writeComplete: state.adminForms.writeComplete,
});

const mapDispatch = dispatch => ({
  getForms: () => dispatch(forms.getForms()),
  resetFormWriteStatus: () => dispatch(forms.resetFormWriteStatus()),
  writeForm: (fields, formId: string) =>
    dispatch(forms.writeForm(formId, fields)),
});

const connector = connect(
  mapState,
  mapDispatch
);

export default connector(FormsEdit);
