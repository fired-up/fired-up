export function postalCodeToRegion(postal_code) {
  // Ensure param is a string to prevent unpredictable parsing results
  if (typeof postal_code !== 'string') {
    console.error('Must pass the zip as a string');
    return;
  }

  // Ensure we have exactly 5 characters to parse
  if (postal_code.length !== 5) {
    console.error('Must pass a 5-digit zip');
    return;
  }

  // Ensure we don't parse strings starting with 0 as octal values
  const thiszip = parseInt(postal_code, 10);

  let st;
  let state;

  // Code blocks alphabetized by state
  if (thiszip >= 35000 && thiszip <= 36999) {
    st = 'AL';
    state = 'Alabama';
  } else if (thiszip >= 99500 && thiszip <= 99999) {
    st = 'AK';
    state = 'Alaska';
  } else if (thiszip >= 85000 && thiszip <= 86999) {
    st = 'AZ';
    state = 'Arizona';
  } else if (thiszip >= 71600 && thiszip <= 72999) {
    st = 'AR';
    state = 'Arkansas';
  } else if (thiszip >= 90000 && thiszip <= 96699) {
    st = 'CA';
    state = 'California';
  } else if (thiszip >= 80000 && thiszip <= 81999) {
    st = 'CO';
    state = 'Colorado';
  } else if (thiszip >= 6000 && thiszip <= 6999) {
    st = 'CT';
    state = 'Connecticut';
  } else if (thiszip >= 19700 && thiszip <= 19999) {
    st = 'DE';
    state = 'Delaware';
  } else if (thiszip >= 32000 && thiszip <= 34999) {
    st = 'FL';
    state = 'Florida';
  } else if (thiszip >= 30000 && thiszip <= 31999) {
    st = 'GA';
    state = 'Georgia';
  } else if (thiszip >= 96700 && thiszip <= 96999) {
    st = 'HI';
    state = 'Hawaii';
  } else if (thiszip >= 83200 && thiszip <= 83999) {
    st = 'ID';
    state = 'Idaho';
  } else if (thiszip >= 60000 && thiszip <= 62999) {
    st = 'IL';
    state = 'Illinois';
  } else if (thiszip >= 46000 && thiszip <= 47999) {
    st = 'IN';
    state = 'Indiana';
  } else if (thiszip >= 50000 && thiszip <= 52999) {
    st = 'IA';
    state = 'Iowa';
  } else if (thiszip >= 66000 && thiszip <= 67999) {
    st = 'KS';
    state = 'Kansas';
  } else if (thiszip >= 40000 && thiszip <= 42999) {
    st = 'KY';
    state = 'Kentucky';
  } else if (thiszip >= 70000 && thiszip <= 71599) {
    st = 'LA';
    state = 'Louisiana';
  } else if (thiszip >= 3900 && thiszip <= 4999) {
    st = 'ME';
    state = 'Maine';
  } else if (thiszip >= 20600 && thiszip <= 21999) {
    st = 'MD';
    state = 'Maryland';
  } else if (thiszip >= 1000 && thiszip <= 2799) {
    st = 'MA';
    state = 'Massachusetts';
  } else if (thiszip >= 48000 && thiszip <= 49999) {
    st = 'MI';
    state = 'Michigan';
  } else if (thiszip >= 55000 && thiszip <= 56999) {
    st = 'MN';
    state = 'Minnesota';
  } else if (thiszip >= 38600 && thiszip <= 39999) {
    st = 'MS';
    state = 'Mississippi';
  } else if (thiszip >= 63000 && thiszip <= 65999) {
    st = 'MO';
    state = 'Missouri';
  } else if (thiszip >= 59000 && thiszip <= 59999) {
    st = 'MT';
    state = 'Montana';
  } else if (thiszip >= 27000 && thiszip <= 28999) {
    st = 'NC';
    state = 'North Carolina';
  } else if (thiszip >= 58000 && thiszip <= 58999) {
    st = 'ND';
    state = 'North Dakota';
  } else if (thiszip >= 68000 && thiszip <= 69999) {
    st = 'NE';
    state = 'Nebraska';
  } else if (thiszip >= 88900 && thiszip <= 89999) {
    st = 'NV';
    state = 'Nevada';
  } else if (thiszip >= 3000 && thiszip <= 3899) {
    st = 'NH';
    state = 'New Hampshire';
  } else if (thiszip >= 7000 && thiszip <= 8999) {
    st = 'NJ';
    state = 'New Jersey';
  } else if (thiszip >= 87000 && thiszip <= 88499) {
    st = 'NM';
    state = 'New Mexico';
  } else if (thiszip >= 10000 && thiszip <= 14999) {
    st = 'NY';
    state = 'New York';
  } else if (thiszip >= 43000 && thiszip <= 45999) {
    st = 'OH';
    state = 'Ohio';
  } else if (thiszip >= 73000 && thiszip <= 74999) {
    st = 'OK';
    state = 'Oklahoma';
  } else if (thiszip >= 97000 && thiszip <= 97999) {
    st = 'OR';
    state = 'Oregon';
  } else if (thiszip >= 15000 && thiszip <= 19699) {
    st = 'PA';
    state = 'Pennsylvania';
  } else if (thiszip >= 300 && thiszip <= 999) {
    st = 'PR';
    state = 'Puerto Rico';
  } else if (thiszip >= 2800 && thiszip <= 2999) {
    st = 'RI';
    state = 'Rhode Island';
  } else if (thiszip >= 29000 && thiszip <= 29999) {
    st = 'SC';
    state = 'South Carolina';
  } else if (thiszip >= 57000 && thiszip <= 57999) {
    st = 'SD';
    state = 'South Dakota';
  } else if (thiszip >= 37000 && thiszip <= 38599) {
    st = 'TN';
    state = 'Tennessee';
  } else if (
    (thiszip >= 75000 && thiszip <= 79999) ||
    (thiszip >= 88500 && thiszip <= 88599)
  ) {
    st = 'TX';
    state = 'Texas';
  } else if (thiszip >= 84000 && thiszip <= 84999) {
    st = 'UT';
    state = 'Utah';
  } else if (thiszip >= 5000 && thiszip <= 5999) {
    st = 'VT';
    state = 'Vermont';
  } else if (thiszip >= 22000 && thiszip <= 24699) {
    st = 'VA';
    state = 'Virgina';
  } else if (thiszip >= 20000 && thiszip <= 20599) {
    st = 'DC';
    state = 'Washington DC';
  } else if (thiszip >= 98000 && thiszip <= 99499) {
    st = 'WA';
    state = 'Washington';
  } else if (thiszip >= 24700 && thiszip <= 26999) {
    st = 'WV';
    state = 'West Virginia';
  } else if (thiszip >= 53000 && thiszip <= 54999) {
    st = 'WI';
    state = 'Wisconsin';
  } else if (thiszip >= 82000 && thiszip <= 83199) {
    st = 'WY';
    state = 'Wyoming';
  } else {
    st = 'none';
    state = 'none';
  }

  return st;
}
