const Validator = require('fastest-validator');
const v = new Validator();

const emailCheck = v.compile({
  email: {
    type: 'email',
    mode: 'precise',
  },
});

const dateCheck = v.compile({
  date: {
    type: 'date',
  },
});

function isValidDate(val) {
  const d = new Date(val);
  const res = dateCheck({ date: d });

  if (typeof res !== 'boolean') {
    console.log(res);
  }

  return typeof res === 'boolean';
}

function isValidEmail(val) {
  const res = emailCheck({ email: val });
  return typeof res === 'boolean';
}

module.exports = [
  {
    name: 'email_address',
    nice_name: 'Email address',
    validation: isValidEmail,
  },
  {
    name: 'given_name',
    nice_name: 'First name',
  },
  {
    name: 'family_name',
    nice_name: 'Last name',
  },
  {
    name: 'locality',
    nice_name: 'City',
  },
  {
    name: 'region',
    nice_name: 'State',
  },
  {
    name: 'address_line1',
    nice_name: 'Address',
  },
  {
    name: 'address_line2',
    nice_name: 'Address (line 2)',
  },
  {
    name: 'postal_code',
    nice_name: 'ZIP Code',
  },
  {
    name: 'phone_number',
    nice_name: 'Phone number',
  },
  {
    name: 'employer',
    nice_name: 'Employer',
  },
  {
    name: 'occupation',
    nice_name: 'Occupation',
  },
  {
    name: 'created_at',
    nice_name: 'Created at',
    validation: isValidDate,
  },
];
