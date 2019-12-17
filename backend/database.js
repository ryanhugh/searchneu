/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import { Op } from 'sequelize';
import { User, FollowedSection, FollowedCourse } from './database/models/index';


// everybody needs a local copy of Postgres, PERIOD.
// TODO: 
// 1. remove all usages of getRef
// 2. correct the keys
// 3. fix up README
class Database {
  constructor() {
    this.users = User;
    this.followedSections = FollowedSection;
    this.followedCourses = FollowedCourse;
  }

  // key is the primaryKey (id, facebookMessengerId) of the user
  // value is any updated columns plus all watchingSections and watchingClasses
  async set(key, value) {
    const user = await (await User.findByPk(key)).update(value, { fields: ['facebookPageId', 'firstName', 'lastName', 'loginKeys'] });
    await Promise.all([ FollowedSection.destroy({ where: { userId: user.id } }), FollowedCourse.destroy({ where: { userId: user.id } }) ]);
    await Promise.all(value.watchingSections.map(section => { return FollowedSection.create({ userId: user.id, sectionId: section }) }));
    await Promise.all(value.watchingClasses.map(section => { return FollowedCourse.create({ userId: user.id, courseId: course }) }));
    return null;
  }

  // Get the value at this key.
  // Key follows the same form in the set method
  // TODO: does this function work when there's a key miss?
  async get(key) {
    const user = await User.findByPk(key);
    const watchingSections = await FollowedSection.findAll({ where: { userId: user.id }, attributes: ['sectionId'] });
    const watchingClasses = await FollowedCourse.findAll({ where: { userId: user.id }, attributes: ['courseId'] });

    return {
      facebookMessengerId: user.id,
      facebookPageId: user.facebookPageId,
      firstName: user.firstName,
      lastName: user.lastName,
      loginKeys: user.loginKeys,
      watchingSections: watchingSections,
      watchingClasses: watchingClasses,
    };
  }

  async getByLoginKey(requestLoginKey) {
    const userId = await User.findOne({ where: { loginKeys: { [Op.contains]: [requestLoginKey] }}});
    return this.get(userId);
  }
  // maybe I can implement getRef with some magic?
}


export default new Database();
