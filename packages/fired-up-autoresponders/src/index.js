import React from 'react';

import AuthWall from 'fired-up-core/src/components/AuthWall';

class Admin extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <AuthWall>{'You’re in'}</AuthWall>
      </div>
    );
  }
}

export default Admin;
