/**
 * React Static Boilerplate
 * https://github.com/kriasoft/react-static-boilerplate
 *
 * Copyright © 2015-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import Relay, { Renderer } from 'react-relay';

function decodeParam(val) {
  if (!(typeof val === 'string' || val.length === 0)) {
    return val;
  }

  try {
    return decodeURIComponent(val);
  } catch (err) {
    if (err instanceof URIError) {
      err.message = `Failed to decode param '${val}'`;
      err.status = 400;
    }

    throw err;
  }
}

// Match the provided URL path pattern to an actual URI string. For example:
//   matchURI({ path: '/posts/:id' }, '/dummy') => null
//   matchURI({ path: '/posts/:id' }, '/posts/123') => { id: 123 }
function matchURI(route, path) {
  const match = route.pattern.exec(path);

  if (!match) {
    return null;
  }

  const params = Object.create(null);

  for (let i = 1; i < match.length; i++) {
    params[route.keys[i - 1].name] = match[i] !== undefined ? decodeParam(match[i]) : undefined;
  }

  return params;
}

class HomeRoute extends Relay.Route {
  static routeName = 'Home';
  static queries = {
    hero: () => Relay.QL`query { hero }`,
  };
};

// Find the route matching the specified location (context), fetch the required data,
// instantiate and return a React component
function resolve(routes, context) {
  for (const route of routes) {
    const params = matchURI(route, context.error ? '/error' : context.pathname);

    if (params) {
      const propKeys = Object.keys(route.props || {});

      return Promise.all([
        route.load(),
        ...propKeys.map(x => route.props[x]).map(x => Promise.resolve(typeof x === 'function' ? x(context) : x)),
      ]).then(([Component, ...data]) => {
        const dataProps = propKeys.reduce((result, key, i) => ({...result, [key]: data[i]}), {});
        console.log('data:', data);
        return (
          <Renderer
            Container={Component}
            queryConfig={new HomeRoute}
            environment={Relay.Store}
            render={({done, error, props, retry, stale}) => {
              if (error) {
                console.log('render failure');
                //if (renderFailure) {
                //  return renderFailure(error, retry);
                //}
              } else if (props) {
                //if (renderFetched) {
                //  return renderFetched(props, {done, stale});
                //} else {
                  return <Component {...props} {...dataProps} />;
                //}
              } else {
                console.log('render loading');
                // if (renderLoading) {
                //   return renderLoading();
                // }
              }
              return undefined;
            }}
          />
        );
        //return <Page route={{...route, params}} error={context.error} {...props} />;
      });
    }

    const error = new Error('Page not found');
    error.status = 404;
    return Promise.reject(error);
  }
}

export default { resolve };
