import firebase from 'firebase-admin';
import _ from 'lodash';
import macros from '../backend/macros';
import { Course, Section, User, FollowedSection, FollowedCourse } from '../backend/database/models/index';

const firebaseConfig = macros.getEnvVariable('firebaseConfig');

firebase.initializeApp({
  credential: firebase.credential.cert(firebaseConfig),
  databaseURL: 'https://search-neu.firebaseio.com/',
});

const db = firebase.database();

db.ref('/users/').once('value').then((snapshot) => {
  Object.values(snapshot.val()).forEach((user) => {

	  user.id = '0'.repeat(16 - user.facebookMessengerId.length) + user.facebookMessengerId;
	
	  User.create(_.omit(user, ['facebookMessengerId', 'watchingSections', 'watchingClasses'])).then((res) => {
	    (user.watchingSections || []).forEach((section) => { 
	      Section.count({ where: { id: section } }).then((count) => {
	        if (count > 0) FollowedSection.create({ userId: res.id, sectionId: section });
	      });
	    });
	
	    (user.watchingClasses || []).forEach((course) => { 
	      Course.count({ where: { id: course } }).then((count) => {
          if (count > 0) FollowedCourse.create({ userId: res.id, courseId: course });
	      });
	    });
	  });
  });
});
