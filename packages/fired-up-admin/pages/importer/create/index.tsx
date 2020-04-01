import _get from 'lodash/get';
import _isEmpty from 'lodash/isEmpty';
import { connect, ConnectedProps } from 'react-redux';
import {
  storage,
  firestore,
  firebase,
} from 'fired-up-core/src/library/firebase';
import Papa from 'papaparse';
import React, { useState } from 'react';

import DashboardLayout from '../../../layouts/Dashboard';
import FieldMapper from '../../../components/Importer/FieldMapper';
import FileDropzone from '../../../components/Dropzone';
import Confirmation from '../../../components/Importer/Confirmation';

import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Paper from '@material-ui/core/Paper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Stepper from '@material-ui/core/Stepper';
import ImporterUploadWidget from '../../../components/Importer/ImporterUploadWidget';
import ImporterSettings, {
  IFormSettings,
} from '../../../components/Importer/ImporterSettings';

const useStyles = makeStyles(theme => ({
  root: {},
  paper: {
    width: '100%',
    padding: theme.spacing(3),
  },
  backButton: {
    marginRight: theme.spacing(1),
  },
  instructions: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  dropzoneContainer: {
    marginTop: theme.spacing(5),
    marginRight: 'auto',
    marginBottom: theme.spacing(3),
    marginLeft: 'auto',
    width: '500px',
  },
}));

type PropsFromRedux = ConnectedProps<typeof connector>;
type ImporterPageProps = PropsFromRedux;

// Easy, accessible reference to file
let _file;

const ImporterPage = (props: ImporterPageProps) => {
  const classes = useStyles({});
  const [activeStep, setActiveStep] = useState(0);
  const [csvData, setCsvData] = useState([]);
  const [map, setMap] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [importComplete, setImportComplete] = useState(false);

  // Form meta:
  const [formSettings, setFormSettings] = useState({});
  const [note, setNote] = useState('');
  const [utm, setUtm] = useState({});

  const steps = ['Select file', 'Select fields', 'Add tags', 'Import'];

  function handleDropped(file: File) {
    _file = file;

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: results => {
        setCsvData(results.data);
        setActiveStep(activeStep + 1);
      },
      error: err => {
        console.log(err);
      },
    });
  }

  function handleFileUploadProgress(snapshot) {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    setUploadProgress(progress);
  }

  function handleFileUploadError(err) {
    console.log(err);
  }

  // this is a callback function for the importer settings widget
  function handleImporterSettings(settings: IFormSettings) {
    if (settings.note) {
      setNote(settings.note);
    }

    setFormSettings({
      ...(settings.create_users && { create_users: true }),
      ...(settings.create_volunteers && { create_volunteers: true }),
    });

    setUtm({
      ...(settings.utm_source && { utm_source: settings.utm_source }),
      ...(settings.utm_medium && { utm_medium: settings.utm_medium }),
      ...(settings.utm_campaign && { utm_campaign: settings.utm_campaign }),
      ...(settings.utm_term && { utm_term: settings.utm_term }),
      ...(settings.utm_content && { utm_content: settings.utm_content }),
    });

    setActiveStep(activeStep + 1);
  }

  async function handleFileUploadComplete(uploadTask) {
    const res = await uploadTask.snapshot.ref.getMetadata();
    await firestore.collection('imports').add({
      bucket: res.bucket,
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      created_by: props.userUid,
      created_by_name: props.userName,
      file_name: res.fullPath,
      map,
      note,
      percent_complete: 0,
      settings: formSettings,
      total_records: csvData.length - 1,
      utm: _isEmpty(utm) ? null : utm,
    });
    setImportComplete(true);
  }

  function handleFileUpload() {
    const filenameWithoutExtension = _file.name.replace('.csv', '');
    const now = new Date().getTime();
    const filename = `${now}-${filenameWithoutExtension}.csv`;

    // Build ref for firebase
    const storageRef = storage.ref();
    const csvRef = storageRef.child(`imports/${filename}`);
    const uploadTask = csvRef.put(_file);
    uploadTask.on(
      'state_changed',
      handleFileUploadProgress,
      handleFileUploadError,
      () => {
        handleFileUploadComplete(uploadTask);
      }
    );
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div className={classes.dropzoneContainer}>
            <FileDropzone onDrop={handleDropped} />
          </div>
        );
      case 1:
        return (
          <FieldMapper
            data={csvData}
            onMapComplete={map => {
              setMap(map);
              setActiveStep(activeStep + 1);
            }}
          />
        );
      case 2:
        return <ImporterSettings handleNext={handleImporterSettings} />;
      case 3:
        return (
          <Confirmation
            data={csvData}
            map={map}
            settings={{
              formSettings,
              note,
              utm,
            }}
            // length - 1 to prevent counting the headers
            totalRecords={csvData.length - 1}
            onConfirm={() => {
              handleFileUpload();
              setActiveStep(activeStep + 1);
            }}
          />
        );
      case 4:
        return (
          <ImporterUploadWidget
            percentComplete={uploadProgress}
            importComplete={importComplete}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  const progress =
    uploadProgress && uploadProgress < 100 ? uploadProgress : null;

  return (
    <DashboardLayout progress={progress}>
      <Container maxWidth="lg">
        <Paper className={classes.paper}>
          <Stepper activeStep={activeStep} alternativeLabel={true}>
            {steps.map((label, index) => {
              const stepProps: { completed?: boolean } = {};
              const labelProps: { optional?: React.ReactNode } = {};
              return (
                <Step key={label} {...stepProps}>
                  <StepLabel {...labelProps}>{label}</StepLabel>
                </Step>
              );
            })}
          </Stepper>
          {getStepContent(activeStep)}
        </Paper>
      </Container>
    </DashboardLayout>
  );
};

const mapState = state => ({
  userName: _get(state, 'auth.user.displayName', null),
  userUid: _get(state, 'auth.user.uid', null),
});

const connector = connect(mapState);

export default connector(ImporterPage);
