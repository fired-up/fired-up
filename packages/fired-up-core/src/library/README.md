# User Context

This module provides a few useful ways to access user data based on the React Context API. The data is shared globally with the entire application if it's wrapped in the UserContext. The user data is stored in localStorage, but the main engine for managing user state should happen within Analytics.js. If Analytics.js is unavailable, then we default to interacting with the data directly from localStorage.

When the user information is updated, a Custom Event is fired named `firedup-user-updated` and provides the traits within the event `detail`.

## Using the Context

You can access the context using the standard [Context API](https://reactjs.org/docs/hooks-reference.html#usecontext).

The simplest way to use UserContext is to simply access the storage mechanism provided by the module. This is a client-side only way to access the user.

```JSX
import { getUser, updateUser } from 'fired-up-core/src/library/user';
// get traits
const traits = getUser();
// set traits
const newTraits = updateUser({ 'foo': 'bar' });
```

### Usage within a Class Component

```JSX
import UserContext from 'fired-up-core/src/library/user';

class Example extends React.Component {
  static contextType = UserContext;

  ...

  someMethod() {
    let trait = this.context.user.some_trait;
  }

  ...

  <Element>{this.context.user.some_trait}</Element>
}
```

### Usage within a nested component

```JSX
import React, { useContext } from 'react';
import { userContext, updateUser } from 'fired-up-core/src/library/user';

const COMP = props => {
  const [user, setUser] = useContext(userContext);
  ...
  doSomething() {
    setUser(newUserObject);
    // want to persist in localstorage?
    updateUser(newUserObject);
  }
  ...

  return (
    <>
      <h3>{user.given_name}</h3>
    </>
  )
}
```

### Usage with React `useContext` hook

```JSX
import UserContext from 'fired-up-core/src/library/user';
import React, { useContext } from 'react';

const COMP = () => {
  const user = useContext(UserContext);

  return (
    <p>{user.given_name} {user.family_name}</p>
  )
}
```

### Usage with a Reducer

You can use the reducer to update user state via [React Reducers](https://reactjs.org/docs/hooks-reference.html#usereducer).

```JSX
import { userReducer } from 'fired-up-core/src/library/user';
...
const [state, dispatch] = useReducer(userReducer, {});
...
dispatch({ type: "UPDATE", traits: {...} });
...
```
