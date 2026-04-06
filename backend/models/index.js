import mongoose from 'mongoose';
import connectDB from '../config/database.js';

// Import models
import User from './user.js';
import Event from './event.js';
import Land from './land.js';
import Tree from './tree.js';
import TreeTask from './treeTask.js';
import EventSupply from './eventSupply.js';
import EventVolunteer from './eventVolunteer.js';
import EventResource from './eventResource.js';
import LandActivity from './landActivity.js';

// Export
const db = {
  mongoose,
  connectDB,
  User,
  Event,
  Land,
  Tree,
  TreeTask,
  EventSupply,
  EventVolunteer,
  EventResource,
  LandActivity,
};

export default db;