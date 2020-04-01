import cx from 'classnames';
import React from 'react';
import ReactModal from 'react-modal';
import { connect } from 'react-redux';

import { closeModal } from '../../stores/ui';

import './Modal.scss';

type ModalProps = {
  closeModal?: () => void;
  id: string;
  modalClass?: string;
  onClose?: () => void;
  overlayClass: string;
};

type ReduxProps = {
  modalIsOpen?: boolean;
};

type ComponentProps = ModalProps & ReduxProps;

type ModalState = {};

class Modal extends React.Component<ComponentProps, ModalState> {
  constructor(props) {
    super(props);

    this.handleAfterOpenFunc = this.handleAfterOpenFunc.bind(this);
    this.handleRequestClose = this.handleRequestClose.bind(this);
  }

  handleAfterOpenFunc() {
    window.scrollTo(0, 0);
  }

  handleRequestClose() {
    if (this.props.onClose) {
      this.props.onClose();
    }

    this.props.closeModal();
  }

  render() {
    const overlayClasses = cx('ntv-modal-overlay', {
      [this.props.overlayClass]: this.props.overlayClass,
    });

    const modalClasses = cx('ntv-modal', {
      [this.props.modalClass]: this.props.modalClass,
    });

    return (
      <React.Fragment>
        <ReactModal
          appElement={
            typeof document !== 'undefined' && document.getElementById('__next')
          }
          className={modalClasses}
          isOpen={this.props.modalIsOpen}
          onAfterOpen={this.handleAfterOpenFunc}
          onRequestClose={this.handleRequestClose}
          overlayClassName={overlayClasses}
          shouldCloseOnEsc={true}
          shouldCloseOnOverlayClick={true}
          style={{
            overlay: {
              zIndex: 10,
            },
          }}
        >
          {this.props.children}
        </ReactModal>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state, componentProps: ModalProps) => ({
  modalIsOpen: state.ui.openModal === componentProps.id,
});

const mapDispatchToProps = dispatch => ({
  closeModal: () => dispatch(closeModal()),
});

export default connect<{}, {}, ModalProps>(
  mapStateToProps,
  mapDispatchToProps
)(Modal);
