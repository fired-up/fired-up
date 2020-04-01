import React from 'react';
import _forEach from 'lodash/forEach';

import { Formik, Field } from 'formik';
import { TextField, CheckboxWithLabel } from 'formik-material-ui';

import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormLabel from '@material-ui/core/FormLabel';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import Typography from '@material-ui/core/Typography';

import { colors } from '../../../styles/variables';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  formGroup: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(5),
    backgroundColor: colors['color-gray-extra-light'],
    borderRadius: '3px',
  },
  formBody: {
    marginRight: 'auto',
    marginLeft: 'auto',
    maxWidth: '500px',
    '& .MuiTextField-root': {
      marginBottom: theme.spacing(3),
    },
    '& .MuiTextField-root:last-of-type': {
      marginBottom: 0,
    },
  },
  formLabel: {
    marginBottom: theme.spacing(1),
  },
}));

export interface IFormSettings {
  create_volunteers: boolean;
  create_users: boolean;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  note: string;
}

interface ImporterSettingsProps {
  handleNext: (settings: IFormSettings) => void;
}

export const tasks = [
  {
    name: 'create_volunteers',
    nice_name: 'Create volunteers',
  },
  {
    name: 'create_users',
    nice_name: 'Create users',
  },
];

export const utms = [
  {
    name: 'utm_source',
    nice_name: 'Source',
  },
  {
    name: 'utm_medium',
    nice_name: 'Medium',
  },
  {
    name: 'utm_campaign',
    nice_name: 'Campaign',
  },
  {
    name: 'utm_term',
    nice_name: 'Term',
  },
  {
    name: 'utm_content',
    nice_name: 'Content',
  },
];

const ImporterSettings = (props: ImporterSettingsProps) => {
  const classes = useStyles({});

  // When we submit this form, we don't want any null values. This will clean out those undesirables
  function handleSubmit(fields) {
    const tempFields = Object.assign({}, fields);
    _forEach(tempFields, (value, key) => {
      if (!value || value === '') {
        delete fields[key];
      }
    });

    return props.handleNext(tempFields);
  }

  const initialValues = {
    create_volunteers: false,
    create_users: false,
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: '',
    note: '',
  };

  return (
    <div>
      <Formik
        enableReinitialize={true}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        render={formProps => {
          return (
            <form onSubmit={formProps.handleSubmit}>
              <div className={classes.sectionHeader}>
                <Typography variant="h6">
                  Select additional settings:
                </Typography>
                <Button
                  color="secondary"
                  endIcon={<NavigateNextIcon />}
                  type="submit"
                  variant="contained"
                >
                  Next
                </Button>
              </div>
              <div className={classes.formBody}>
                <FormControl fullWidth={true} className={classes.formGroup}>
                  <FormLabel component="legend" className={classes.formLabel}>
                    Imported user settings
                  </FormLabel>
                  {tasks.map((task, idx) => {
                    return (
                      <Field
                        component={CheckboxWithLabel}
                        key={idx}
                        name={task.name}
                        Label={{
                          label: task.nice_name,
                        }}
                      />
                    );
                  })}
                </FormControl>

                <FormControl fullWidth={true} className={classes.formGroup}>
                  <FormLabel component="legend" className={classes.formLabel}>
                    Add UTM parameters
                  </FormLabel>
                  {utms.map(utm => {
                    return (
                      <Field
                        component={TextField}
                        key={utm.name}
                        label={utm.nice_name}
                        name={utm.name}
                      />
                    );
                  })}
                  <FormHelperText>
                    Note: these will apply to all imported signups
                  </FormHelperText>
                </FormControl>

                <FormControl fullWidth={true} className={classes.formGroup}>
                  <FormLabel component="legend" className={classes.formLabel}>
                    (optional) Leave a note about this import
                  </FormLabel>
                  <Field component={TextField} label="Note" name="note" />
                </FormControl>
              </div>
            </form>
          );
        }}
      />
    </div>
  );
};

export default ImporterSettings;
