import _pick from 'lodash/pick';

// Remove any validation functions from a `col` since we only want column info
// Keeping validation info wreaks havoc with webworkers
export const pickColFields = col => {
  return _pick(col, ['name', 'nice_name']);
};
