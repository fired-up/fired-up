import _get from 'lodash/get';
import { connect } from 'react-redux';
import { Formik, Field, FormikActions } from 'formik';
import React from 'react';

import { closeModal, MODAL_TYPES } from '../../../stores/ui';

import Modal from '../../Modal';
import CloseButton from '../../CloseButton/CloseButton';

import updateUser from './library';
import './EditUserModal.scss';

type EditUserPageModalProps = {
  closeModal?: () => void;
  onClose?: () => void;
  handleEditComplete: (updatedRecruitmentPageDetails) => void;
  user?: any;
};

type EditUserPageModalState = {
  error: string;
  updateComplete: boolean;
};

class EditUserPageModal extends React.Component<
  EditUserPageModalProps,
  EditUserPageModalState
> {
  state = {
    error: '',
    updateComplete: false,
  };

  readonly handleModalClose = e => {
    e.stopPropagation();
    this.props.closeModal();
  };

  readonly handleFormSubmit = async (
    values,
    formikActions: FormikActions<{}>
  ) => {
    try {
      formikActions.setSubmitting(true);
      const userUid = this.props.user.uid;
      const updatingUserUid = _get(this.props, 'auth.user.uid', null);
      const valuesForUpdate = {
        given_name: values.given_name,
        family_name: values.family_name,
      };
      await updateUser(updatingUserUid, userUid, valuesForUpdate);
      this.setState(
        {
          updateComplete: true,
        },
        () => {
          window.setTimeout(() => {
            location.reload();
          }, 1000);
        }
      );
    } catch (err) {
      formikActions.setSubmitting(false);
      this.setState({
        error: 'Unable to update',
      });
    }
  };

  render() {
    const initialValues = {
      given_name: _get(this.props, 'user.given_name', ''),
      family_name: _get(this.props, 'user.family_name', ''),
    };

    return (
      <Modal
        id={MODAL_TYPES.EDIT_USER}
        onClose={this.props.onClose}
        overlayClass="page-overlay-modal-overlay"
      >
        <div className="modal-content-container edit-user-modal">
          <div className="modal-content-close-button">
            <button
              className="close-button-container"
              onClick={this.handleModalClose}
            >
              <CloseButton fill="black" />
            </button>
          </div>
          <div className="modal-content-inner">
            <Formik
              enableReinitialize={true}
              initialValues={initialValues}
              onSubmit={this.handleFormSubmit}
              render={formProps => {
                return (
                  <>
                    <form onSubmit={formProps.handleSubmit}>
                      <p>
                        <strong>
                          Use this form to update a user's profile.
                        </strong>
                      </p>
                      <div className="form-group row">
                        <div className="col-md-6">
                          <label className="control-label">First name</label>
                          <Field
                            className="form-control"
                            name="given_name"
                            type="text"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="control-label">Last name</label>
                          <Field
                            className="form-control"
                            name="family_name"
                            type="text"
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <button
                          className="btn btn-primary"
                          disabled={formProps.isSubmitting}
                          type="submit"
                        >
                          {this.state.updateComplete
                            ? 'Updated! refreshing page...'
                            : 'Save changes'}
                        </button>
                      </div>
                    </form>
                  </>
                );
              }}
            />
          </div>
        </div>
      </Modal>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  closeModal: () => dispatch(closeModal()),
});

const mapStateToProps = state => ({
  auth: state.auth,
});

export default connect<{}, {}, EditUserPageModalProps>(
  mapStateToProps,
  mapDispatchToProps
)(EditUserPageModal);
