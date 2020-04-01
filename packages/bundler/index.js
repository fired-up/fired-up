import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'custom-event-polyfill';

import React from 'react';
import { render } from 'react-dom';

import Form from '../fired-up-forms/src';

const loaders = [
  {
    path: 'form',
    datasetID: 'form',
    divID: 'react-form',
    component: Form,
  },
];

if (
  process.env.NODE_ENV !== 'production' &&
  !process.env.REACT_APP_WORDPRESS_MOUNT
) {
  const path = window.location.pathname.split('/')[1];

  for (const i in loaders) {
    const loader = loaders[i];

    if (path !== '' && loader.path.startsWith(path)) {
      const props = {};
      const dataset = document.getElementById('root')
        ? document.getElementById('root').dataset
        : {};

      // Any JSON strings should be parsed
      for (const key in dataset) {
        if (dataset[key]) {
          try {
            props[key] = JSON.parse(dataset[key]);
          } catch (error) {
            props[key] = dataset[key];
          }
        }
      }

      render(
        <loader.component divID={'root'} {...props} />,
        document.getElementById('root')
      );
    }
  }
} else {
  for (const i in loaders) {
    const loader = loaders[i];
    const idMatched = document.getElementById(loader.divID);
    const classMatches = document.getElementsByClassName('fired-up-embed');

    if (classMatches.length > 0) {
      for (const j in classMatches) {
        const element = classMatches[j];

        if (
          element &&
          element.dataset &&
          element.dataset.firedUpWidget === loader.datasetID
        ) {
          const props = {};
          const dataset = element.dataset;

          // Any JSON strings should be parsed
          for (const key in dataset) {
            if (dataset[key]) {
              try {
                props[key] = JSON.parse(dataset[key]);
              } catch (error) {
                props[key] = dataset[key];
              }
            }
          }

          render(<loader.component {...props} />, element);
        }
      }
    }

    if (idMatched) {
      render(
        <loader.component divID={loader.divID} />,
        document.getElementById(loader.divID)
      );
    }
  }
}
