import React from 'react';
import { connect } from 'react-redux';

import Login from '../Login';

class AuthWall extends React.Component {
  constructor(props) {
    super(props);

    if (!Array.isArray(this.props.roles)) {
      this.roles = [props.roles];
    } else {
      this.roles = props.roles;
    }

    this.state = {
      user: null,
      authorized: false,
    };
  }

  render() {
    if (!this.props.auth.hasCheckedAuth) {
      return (
        <div className={this.props.className}>
          <p>Waiting for login status...</p>
        </div>
      );
    }

    if (
      this.props.auth.isLoggedIn &&
      this.roles.indexOf(this.props.auth.role) !== -1 &&
      this.props.auth.provider === 'google.com'
    ) {
      return this.props.children;
    }

    if (
      (this.props.auth.isLoggedIn &&
        this.roles.indexOf(this.props.auth.role) === -1) ||
      (this.props.auth.isLoggedIn && this.props.auth.provider !== 'google.com')
    ) {
      return (
        <div className={this.props.className}>
          <p className="text-danger">
            Invalid signin method. If you were previously signed in, try signing
            in again.
          </p>
          <Login />
        </div>
      );
    }

    return (
      <div className={this.props.className}>
        <p>Please login to continue</p>
        <Login />
      </div>
    );
  }
}

export default connect(state => ({
  auth: state.auth,
}))(AuthWall);
