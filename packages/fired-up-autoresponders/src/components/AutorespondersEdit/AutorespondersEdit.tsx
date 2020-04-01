import * as yup from 'yup';
import React from 'react';
import Router from 'next/router';
import { connect } from 'react-redux';
import { Formik, Field, FormikProps } from 'formik';
import {
  difference as _difference,
  get as _get,
  isEmpty as _isEmpty,
  keys as _keys,
} from 'lodash';

import autoresponders from '../../stores/index';
import { sendAutoresponder } from '../../library/autoresponders';

import WYSIWYG from '../../components/WYSIWYG/WYSIWYG';

type AutorespondersEditProps = {
  id: string;
  autoresponder: any;
};

type AutorespondersEditState = {
  error: string;
  isPreviewing: boolean;
  previewEmailAddress: string;
  previewEmailError: boolean;
  readyToRender: boolean;
  isSubmittingPreview: boolean;
};

class AutorespondersEdit extends React.Component<
  AutorespondersEditProps,
  AutorespondersEditState
> {
  constructor(props) {
    super(props);

    this.state = {
      error: '',
      isPreviewing: false,
      previewEmailAddress: '',
      previewEmailError: false,
      readyToRender: true,
      isSubmittingPreview: false,
    };

    this.getContent = this.getContent.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  private wysiwyg = React.createRef();

  componentDidMount() {
    if (this.props.id) {
      return this.props.getAutoresponders();
    }

    this.setState({
      readyToRender: true,
    });
  }

  componentDidUpdate(prevProps) {
    if (!this.props.id && this.state.isPreviewing) {
      const currentResponderIds = Object.keys(this.props.autoresponders);
      const prevResponderIds = Object.keys(prevProps.autoresponders);
      const newFormId = _difference(currentResponderIds, prevResponderIds);

      if (typeof newFormId[0] !== 'undefined') {
        Router.push(`/autoresponders/edit/${newFormId}`);
      }
    }
  }

  getContent() {
    const content = this.wysiwyg.current.getContent();
    return content;
  }

  async handleSubmit(fields, formHelpers) {
    const content = this.getContent();
    const autoresponderFields = Object.assign({}, fields, {
      content,
    });

    try {
      await this.props.writeAutoresponder(autoresponderFields, this.props.id);
      Router.push('/autoresponders');
    } catch (error) {
      formHelpers.setSubmitting(false);
      this.setState({ error });
    }
  }

  async handlePreview(formProps: FormikProps<any>) {
    const result = await formProps.validateForm();
    const content = this.getContent();

    if (
      this.props.id &&
      (!_isEmpty(result) || !content || !this.state.previewEmailAddress)
    ) {
      return this.setState({
        previewEmailError: true,
      });
    }

    if (!this.props.id) {
      this.setState({
        isPreviewing: true,
      });
    } else {
      this.setState({
        isSubmittingPreview: true,
      });
    }

    const autoresponderData = Object.assign({}, formProps.values, { content });
    try {
      await this.props.writeAutoresponder(autoresponderData, this.props.id);

      if (this.props.id) {
        await sendAutoresponder(this.props.id, this.state.previewEmailAddress);
        this.setState({
          isSubmittingPreview: false,
        });
      }
    } catch (err) {
      this.setState({
        isPreviewing: false,
      });
      console.log(err);
    }
  }

  renderForm() {
    let initialValues = {
      name: _get(this.props.autoresponder, 'name', ''),
      subject: _get(this.props.autoresponder, 'subject', ''),
    };

    const validationSchemaShape = {
      name: yup.string().required('Required'),
      subject: yup.string().required('Required'),
    };

    const validationSchema = yup.object().shape(validationSchemaShape);

    return (
      <Formik
        enableReinitialize={true}
        initialValues={initialValues}
        onSubmit={this.handleSubmit}
        validationSchema={validationSchema}
        render={formProps => {
          return (
            <form onSubmit={formProps.handleSubmit}>
              <div className="form-group row">
                <div className="col-12">
                  <label className="control-label">
                    Autoresponder name (for internal use only)
                  </label>
                  <Field
                    className="form-control"
                    name="name"
                    required
                    type="text"
                  />
                </div>
              </div>
              <div className="form-group row">
                <div className="col-12">
                  <label className="control-label">Subject</label>
                  <Field
                    className="form-control"
                    name="subject"
                    required
                    type="text"
                  />
                </div>
              </div>
              <div className="form-group row">
                <div className="col-12">
                  <WYSIWYG
                    content={_get(this.props.autoresponder, 'content', '')}
                    ref={this.wysiwyg}
                  />
                </div>
              </div>
              <div className="form-group row align-items-end">
                <div className="col-md-8">
                  <legend>Send preview email</legend>
                  {this.state.previewEmailError && (
                    <p
                      className="text-danger"
                      style={{
                        fontWeight: 'bold',
                        marginBottom: 0,
                      }}
                    >
                      Ensure all fields are filled out
                    </p>
                  )}
                  <label
                    className="control-label"
                    style={{
                      marginBottom: this.props.id ? 0 : 'auto',
                    }}
                  >
                    Saves the autoresponder and sends a copy to the specified
                    email address
                  </label>
                  {this.props.id && (
                    <input
                      className="form-control"
                      disabled={this.state.isSubmittingPreview}
                      name="preview-email"
                      onChange={e => {
                        this.setState({
                          previewEmailAddress: e.target.value,
                          previewEmailError: false,
                        });
                      }}
                      placeholder="email@example.com"
                      type="text"
                      value={this.state.previewEmailAddress}
                    />
                  )}
                </div>
                <div className="col-md-4">
                  <button
                    className={`btn ${
                      this.state.isSubmittingPreview
                        ? 'btn-disabled'
                        : 'btn-primary'
                    }`}
                    onClick={e => {
                      e.preventDefault();
                      this.handlePreview(formProps);
                    }}
                  >
                    {this.props.id
                      ? this.state.isSubmittingPreview
                        ? 'Sending...'
                        : 'Send preview'
                      : 'Save to send preview'}
                  </button>
                </div>
              </div>
              <hr />
              <div className="form-group row">
                <div className="col-12">
                  <div className="form-group button-group">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={formProps.isSubmitting}
                    >
                      {formProps.isSubmitting
                        ? 'Submitting...'
                        : this.props.id
                        ? 'Save edits'
                        : 'Create autoresponder and return to list of autoresponders'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          );
        }}
      />
    );
  }

  render() {
    if (this.state.readyToRender) {
      return (
        <div>
          {this.state.error && (
            <div className="text-danger form-group">{this.state.error}</div>
          )}

          {this.renderForm()}
        </div>
      );
    }

    return <div>Loading...</div>;
  }
}

const mapDispatchToProps = dispatch => ({
  getAutoresponders: () => dispatch(autoresponders.getAutoresponders()),
  writeAutoresponder: (fields: object, id: string) =>
    dispatch(autoresponders.writeAutoresponder(fields, id)),
});

const mapStateToProps = (state, ownProps) => ({
  autoresponders: state.adminAutoresponders.autoresponders,
  autoresponder: _get(
    state.adminAutoresponders,
    `autoresponders[${ownProps.id}]`
  ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AutorespondersEdit);
