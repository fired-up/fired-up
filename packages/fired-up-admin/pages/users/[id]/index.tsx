import _get from 'lodash/get';
import _sortBy from 'lodash/sortBy';
import { firestore } from 'fired-up-core/src/library/firebase';
import { NextPage } from 'next';
import {
  useDocumentData,
  useCollectionData,
} from 'react-firebase-hooks/firestore';
import format from 'date-fns/format';
import isValid from 'date-fns/isValid';
import React from 'react';

import DashboardLayout from '../../../layouts/Dashboard';

import { Paper, Typography, Avatar } from '@material-ui/core';

import { FiredUp } from '../../../../fired-up-typings/functions/typings/firedup';
import useStyles from './styles';
import { CREATED_AT_DATE_FORMATTING } from '../../../utils/constants';

type UserDetailsPageProps = {
  id?: string;
};

const UserDetailsPage: NextPage = (props: UserDetailsPageProps) => {
  const [user, userLoading] = useDocumentData<FiredUp.User>(
    props.id && firestore.collection('users').doc(props.id)
  );
  const [personSnapshot, personLoading] = useCollectionData<
    FiredUp.Person
  >(
    user &&
      firestore
        .collection('people')
        .where('email_address', '==', user.email_address)
  );

  const classes = useStyles({
    latitude: !personLoading && _get(personSnapshot, '[0].latitude', null),
    longitude: !personLoading && _get(personSnapshot, '[0].longitude', null),
  });

  function renderInterior() {
    if (userLoading || !user)
      return null;

    /**
     * The following is a workaround since our collections have a mix of Firestore.Timestamps and dates represented as strings
     */
    const created_at = isValid(new Date(user.created_at))
      ? user.created_at
      : user.created_at.toDate();

    let last_login_at;
    if (typeof user.last_login_at === 'undefined') {
      last_login_at = null;
    }

    // @ts-ignore
    else if (isValid(new Date(user.last_login_at))) {
      last_login_at = user.last_login_at;
    } else {
      last_login_at = user.last_login_at.toDate();
    }

    const person = _get(personSnapshot, '[0]', {});

    return (
      <div>
        <header className={classes.profileHeader}>
          <div className={classes.profileHeaderForeground}>
            <Avatar
              className={classes.profileHeaderAvatar}
              src={`${process.env.CLOUDINARY_URL}/image/upload/w_300/c_thumb,w_300,h_300,g_face,z_0.6,d_avatar/${user.avatarPath}`}
            />
            <div>
              <Typography variant="h6" className={classes.userName}>
                {user.given_name} {user.family_name}
              </Typography>
              <Typography variant="body2">
                Member since: {format(created_at, CREATED_AT_DATE_FORMATTING)}
              </Typography>
              {last_login_at && (
                <Typography variant="body2">
                  Last logged in:{' '}
                  {format(last_login_at, CREATED_AT_DATE_FORMATTING)}
                </Typography>
              )}
            </div>
          </div>
          <div className={classes.mapBg} />
        </header>
        <section className={classes.profileSection}>
          <table className={classes.table}>
            <tbody>
              <tr>
                <td>Email address</td>
                <td>{user.email_address}</td>
              </tr>
              {_get(person, 'occupation') && (
                <tr>
                  <td>Occupation</td>
                  <td>{person.occupation}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    );
  }

  return (
    <DashboardLayout title="View user">
      <Paper className={classes.root}>{renderInterior()}</Paper>
      <Paper></Paper>
    </DashboardLayout>
  );
};

UserDetailsPage.getInitialProps = async ctx => {
  const { id } = ctx.query;
  return { id };
};

export default UserDetailsPage;
