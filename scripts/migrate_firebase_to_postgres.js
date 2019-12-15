import firebase from 'firebase-admin';
import macros from '../backend/macros';
import { User, FollowedSection, FollowedCourse } from '../backend/database/models/index';

const firebaseConfig = macros.getEnvVariable('firebaseConfig');

firebase.initializeApp({
  credential: firebase.credential.cert(firebaseConfig),
  databaseURL: 'https://search-neu.firebaseio.com/',
});

const db = firebase.database();

db.ref('/users/').once('value').then((users) => {
  users.forEach((user) => {
    User.create({ id: user.facebookMessengerId, facebookPageId: user.facebookPageId, firstName: user.firstName, lastName: user.lastName, loginKeys: user.loginKeys })
      .then((res) => {

      user.watchingSections.forEach((section) => { FollowedSection.create({ userId: res.id, sectionId: followedSection }); });
      user.watchingCourses.forEach((course) => { FollowedCourse.create({ userId: res.id, courseId: followedCourse }); });
    });
  });
});
