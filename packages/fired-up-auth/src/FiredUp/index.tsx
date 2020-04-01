import React from 'react';
import { UserProvider } from 'fired-up-core/src/library/user';

// Front-end uses dispatch
function FiredUp(props) {
  return <UserProvider>{props.children}</UserProvider>;
}

export default FiredUp;
