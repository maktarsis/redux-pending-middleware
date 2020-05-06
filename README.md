# Redux Pending Middleware

A redux [middleware](https://redux.js.org/advanced/middleware) which tracks your asynchronous [redux](http://redux.js.org) actions (effects) and informs about the progress through selector function.

<br/>

List of supported libraries that process redux effects:

- [redux-toolkit](https://github.com/reduxjs/redux-toolkit)
- [redux-saga](https://github.com/redux-saga/redux-saga)
- [redux-thunk](https://github.com/reduxjs/redux-thunk) / [redux-promise-middleware](https://github.com/pburtchaell/redux-promise-middleware)

It's worth mention that `redux-pending-middleware` allows you to code simultaneously with all the above libraries simultaneously.

<br/>

## Problem it solves

Have you ever been in a situation where you need to add a global loader/spinner to any side effect that you process using third-party libraries such as Redux and some kind of library for asynchronous processing, for example, redux-saga / redux-thunk / promise middlewares?

Why is that bad?

- It is very unpleasant to create separately for this state and add start and end actions for these actions to each request.
- This is an open place to make mistakes because it's very easy to forget to add or remove these actions.
- It needs to be supported and somehow live with it.

Well, `redux-pending-middleware` does this from scratch:

- tracks your asynchronous code
- collects them in a bunch
- efficiently calculates active pending effects
- provides a selector for information about the current state of application loading
- available for debug in redux-devtools
- independent of a particular asynchronous processing solution. Can be used simultaneously with `redux-saga` and `redux-toolkit`
- replaces `redux-thunk` in the matters of side effects (not actions chaining) and `redux-promise-middleware` (essentially uses it out of the box)

## Quick start

### Installation

```shell script
npm install redux-pending-middleware
```

### Extend reducers

`redux-pending-middleware` provides its own state for storing active effects (pending promise phase).

```javascript
import { combineReducers } from 'redux';
import { insertPending } from 'redux-pending-middleware';

import { planetReducer as planet } from './planetReducer';
import { universeReducer as universe } from './universeReducer';

export const rootReducer = combineReducers(
  insertPending({
    planet,
    universe
  })
);
```

### Configuration

Depending on what you use in the project, import into the project. Now let's dwell on this in more detail.

- ### [redux-toolkit](https://github.com/reduxjs/redux-toolkit)

This approach is simplest and clear. Just add the middleware and use your regular toolkit async actions as usual.

```javascript
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { reduxPendingToolkitMiddleware } from 'redux-pending-middleware';
import { rootReducer as reducer } from './root.reducer';

const defaultMiddlewares = getDefaultMiddleware();
const middleware = [reduxPendingToolkitMiddleware, ...defaultMiddlewares];

export const store = configureStore({ reducer, middleware });
```

- ### [redux-saga](https://github.com/redux-saga/redux-saga)

If your project uses `redux-saga` no additional configuration needed.

This approach is that you need to wrap the saga worker.
This allows to track the start and the end of each effect.

```javascript
import { trackWorker } from 'redux-pending-middleware';
import { call, put, takeEvery } from '@redux-saga/core/effects';

function* getPlanets() {
  yield takeEvery(getPlanetsRequest.type, trackWorker(handleGetPlanets));
}

function* handleGetPlanets() {
  const planets = yield call(Api.getPlanets);
  yield put(getPlanetsCompleted(planets));
}
```

This approach successfully combined with custom wrappers on top of the worker, for example, error handling.

```javascript
const workerWrapper = worker => {
  return trackWorker(customWrapper);

  function* customWrapper(...args) {
    try {
      yield* worker(...args);
    } catch (error) {
      yield put(setFetchError(error));
    }
  }
};
```

- ### [redux-thunk](https://github.com/reduxjs/redux-thunk) / [redux-promise-middleware](https://github.com/pburtchaell/redux-promise-middleware)

Ok, here I need to explain the problem a bit

It’s not entirely true this package supports `redux-thunk`, but the truth is that you can forward promises to payload.
That is the way `redux-promise-middleware` does. At the moment, this library completely replaces `redux-promise-middleware`.
In the plans, through the collaboration, expand the API of `redux-promise-middleware` in order to reuse their code.

For details, you can go to read the documentation of `redux-promise-middleware` about how this works.

In short, everything is quite simple.
You pass Promise as payload and we will have stateful types inside the reducer.
Let's say we have action type `GET_PLANETS`, so when we call our action with a type and a promise in the payload, it first triggers a reducer with `GET_PLANETS_PENDING`.
Then, when our promise resolved, we will have `GET_PLANETS_FULFILLED` type inside the reducer, and a value of resolved promise as a payload.
But, if an error occurs in our promise, then we get the type `GET_PLANETS_REJECTED` with a reason within property payload.

```javascript
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { reduxPendingPromiseMiddleware } from 'redux-pending-middleware';
import { rootReducer as reducer } from './root.reducer';

const defaultMiddlewares = getDefaultMiddleware();
const middleware = [reduxPendingPromiseMiddleware, ...defaultMiddlewares];

export const store = configureStore({ reducer, middleware });

/**
 * somewhere in the /src
 * saga usage example with trackWorker
 */
function getPlanets() {
  return {
    type: 'GET_PLANETS',
    payload: fetch('planets')
  };
}
```

### Connecting the dots

For everything to work at the same time, you need to use all the previous steps

```javascript
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import {
  reduxPendingPromiseMiddleware,
  reduxPendingToolkitMiddleware,
  trackWorker
} from 'redux-pending-middleware';
import createSagaMiddleware from '@redux-saga/core';
import { call, put, takeEvery } from '@redux-saga/core/effects';
import { rootReducer as reducer } from './root.reducer';
import { rootSaga } from './root.saga';

const defaultMiddlewares = getDefaultMiddleware();
const sagaMiddleware = createSagaMiddleware();
const middleware = [
  reduxPendingPromiseMiddleware,
  reduxPendingToolkitMiddleware,
  sagaMiddleware,
  ...defaultMiddlewares
];

export const store = configureStore({ reducer, middleware });

sagaMiddleware.run(rootSaga);

/**
 * somewhere in the /src
 * saga usage example with trackWorker
 */
function* getPlanets() {
  yield takeEvery(getPlanetsRequest.type, trackWorker(handleGetPlanets));
}

function* handleGetPlanets() {
  const planets = yield call(Api.getPlanets);
  yield put(getPlanetsCompleted(planets));
}
```

<br/>

### Selector

Just a regular usage of redux selectors

```javascript
import React from 'react';
import { useSelector } from 'react-redux';
import { selectIsPending } from 'redux-pending-middleware';

import { YourApplication } from './YourApplication';
import { AppLoader } from './App.loader';

export const App = () => {
  const isPending = useSelector(selectIsPending);

  return isPending ? <AppLoader /> : <YourApplication />;
};
```

<br/>

### Contributing

Contributions are welcome. For major changes, please open an issue first to discuss what you would like to change.

If you made a PR, make sure to update tests as appropriate and keep the examples consistent.

<br/>

### Contact

Please reach me out if you have any questions or comments.

- [GitHub](https://github.com/maktarsis)
- [Twitter](https://twitter.com/maktarsis)

<br/>

### References

I find these packages useful and similar for this one. So, it's important to mention them here.

- [redux-pending](https://www.npmjs.com/package/redux-pending)
- [redux-pender](https://www.npmjs.com/package/redux-pender)
- [redux-promise-middleware](https://www.npmjs.com/package/redux-promise-middleware)

The main reason why I didn’t choose them: they do one thing, and it’s impossible to add something second to them.

<br/>

### License

This project is [MIT](https://choosealicense.com/licenses/mit/) licensed.

<br/>