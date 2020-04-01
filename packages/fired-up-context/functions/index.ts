import * as Cors from 'cors';
import * as https from 'https';
import * as functions from 'firebase-functions';
import * as zips from './sortedZip.json';

const mapSearch = (target, zipTable) => {
  try {
    const latSearch = (target, arr, lat) => {
      if (lat <= 200) return arr;
      const idx = Math.floor(lat / 2);
      if (target > arr[idx][0])
        return latSearch(target, arr.slice(idx, arr.length), idx);
      return latSearch(target, arr.slice(0, idx), idx);
    };

    const lngSearch = (target, arr, lng) => {
      if (lng <= 2) return arr[0];
      const idx = Math.floor(lng / 2);
      if (target > arr[idx][1])
        return lngSearch(target, arr.slice(idx, arr.length), idx);
      return lngSearch(target, arr.slice(0, idx), idx);
    };

    // narrow results by latitude
    const lats = latSearch(target[0], zipTable, zipTable.length);

    // sort narrowed results by longitude
    const latsSort = lats.sort((a, b) => {
      if (a[1] < b[1]) return -1;
      if (a[1] > b[1]) return 1;
      return 0;
    });

    // find item by longitude
    return lngSearch(target[1], latsSort, latsSort.length)[2];
  } catch (e) {
    return '';
  }
};

const cors = Cors({ origin: true });

export const firedupContext = functions.https.onRequest(async (req, res) => {
  const useragent = require('useragent');

  const whitelist = ['city', 'citylatlong', 'country', 'region', 'user-ip'];
  const context = {};

  for (const key of whitelist) {
    if (req.headers[`x-appengine-${key}`]) {
      context[key] = req.headers[`x-appengine-${key}`];
    }
  }

  if (req.headers['user-agent']) {
    const parsed = useragent.parse(req.headers['user-agent']);
    context['user-agent'] = parsed.toJSON();
  }

  const citylatlong = context['citylatlong'];

  if (
    citylatlong &&
    typeof citylatlong === 'string' &&
    citylatlong.indexOf(',') > 0
  ) {
    const latlong = context['citylatlong'].split(',');

    if (latlong && latlong.length === 2) {
      context['inferred-zip'] = mapSearch(latlong, zips);
    }
  }

  cors(req, res, () => {
    res
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(context, null, 4));
  });
});
