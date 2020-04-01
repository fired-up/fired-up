export default async function(signup: FiredUp.Signup) {
  //campaign__launch|source__gs|medium__gs|term__dd_dd_us_key_txt|content__
  const utm = {
    content: null,
    medium: null,
    name: null,
    source: null,
    term: null,
  };

  if (signup.actblue_refcode2 && signup.actblue_refcode2.indexOf('|') !== -1) {
    const split = signup.actblue_refcode2.split('|');

    for (const param of split) {
      const [key, value] = param.split('__');

      if (key === 'campaign') {
        utm.name = value;
      } else {
        utm[key] = value;
      }
    }
  }

  return {
    utm,
  };
}
