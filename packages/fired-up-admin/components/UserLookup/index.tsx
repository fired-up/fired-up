import React from 'react';
import { Field, Formik } from 'formik';

import getUser from './library';

type UserLookupProps = {
  defaultId?: string;
  handleUserSearch?: (user) => void;
};

class UserLookup extends React.Component<UserLookupProps, {}> {
  state = {
    error: '',
  };

  componentDidMount() {
    if (this.props.defaultId) {
      this.handleFormSubmit({ userIdentifier: this.props.defaultId });
    }
  }

  readonly handleFormSubmit = async fields => {
    try {
      const user = await getUser(fields.userIdentifier);
      this.props.handleUserSearch(user);
    } catch (error) {
      this.props.handleUserSearch(error);
    }
  };

  render() {
    const initialValues = {
      userIdentifier: this.props.defaultId || '',
    };

    return (
      <Formik
        enableReinitialize={true}
        initialValues={initialValues}
        onSubmit={this.handleFormSubmit}
        render={formProps => {
          return (
            <>
              <form className="form-inline" onSubmit={formProps.handleSubmit}>
                <div className="form-group flex-grow-1">
                  <Field
                    className="form-control"
                    name="userIdentifier"
                    placeholder="User email address or User ID"
                    style={{
                      width: '100%',
                    }}
                    type="text"
                  />
                </div>
                <div className="form-group ml-3">
                  <button className="btn btn-primary" type="submit">
                    Search
                  </button>
                </div>
              </form>
              {this.state.error && <p>{this.state.error}</p>}
            </>
          );
        }}
      />
    );
  }
}

export default UserLookup;
