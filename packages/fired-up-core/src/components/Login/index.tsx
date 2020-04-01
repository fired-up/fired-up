import React from 'react';
import { connect } from 'react-redux';
import auth from '../../stores/auth';

class Login extends React.Component {
  readonly handleClick = () => {
    this.props.dispatch(auth.login()).then(user => {
      this.props.dispatch(auth.authElevationListener(user));
    });
  };

  render() {
    return (
      <div>
        <button onClick={this.handleClick} className="btn btn-primary">
          Login with Google
        </button>
      </div>
    );
  }
}

export default connect(state => ({
  auth: state.auth,
}))(Login);
