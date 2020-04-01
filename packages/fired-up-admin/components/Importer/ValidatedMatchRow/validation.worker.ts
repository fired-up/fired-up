import _find from 'lodash/find';

import cols from '../cols';

self.addEventListener('message', event => {
  const colData = _find(cols, { name: event.data.mapItem.name });
  let isValid = true;
  let numErrors = 0;
  let i = 0;

  for (const row of event.data.csv) {
    i++;
    if (i % 1000 === 0) {
      // @ts-ignore
      self.postMessage({
        type: 'count',
        body: {
          count: i,
        },
      });
    }
    const item = row[event.data.columnIndex];
    const v = colData.validation(item);
    if (!v) {
      isValid = false;
      numErrors++;
    }
  }

  try {
    // @ts-ignore
    self.postMessage({
      type: 'validity',
      body: {
        isValid,
        numErrors,
      },
    });
  } catch (err) {
    console.log(err);
  }
});
