//
// Validators must accept a string and return a boolean
//

/**
 * Postal code is 5 digits
 * @param {string} input
 */
function postal_code(input) {
  if (
    typeof input === 'string' &&
    input.length === 5 &&
    !isNaN(Number(input))
  ) {
    return true;
  }

  return false;
}

export default {
  postal_code,
};
