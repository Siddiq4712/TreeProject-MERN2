import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';
import { getAdminSeedConfig } from '../config/env.js';

const formatUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  account_type: user.account_type,
  organization_name: user.organization_name || null,
  phone: user.phone || null,
  sponsor_logo_url: user.sponsor_logo_url || null,
  bio: user.bio || null,
  is_active: user.is_active,
  karma_points: user.karma_points,
});

export const registerUser = async (payload) => {
  const {
    name,
    email,
    password,
    role,
    account_type,
    organization_name,
    phone,
    sponsor_logo_url,
    bio,
  } = payload;

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = String(password);

  // Check if user exists
  const existingUser = await db.User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw { status: 409, message: 'Email already in use' };
  }

  if (role === 'Admin') {
    throw { status: 403, message: 'Admin accounts cannot be created from public registration' };
  }

  if (account_type === 'Organization' && !organization_name) {
    throw { status: 400, message: 'Organization name is required for organization accounts' };
  }

  if (normalizedPassword.length < 8) {
    throw { status: 400, message: 'Password must be at least 8 characters long' };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

  // Create user
  const newUser = await db.User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    role: role || 'Volunteer',
    account_type: account_type || 'Individual',
    organization_name: organization_name || null,
    phone: phone || null,
    sponsor_logo_url: sponsor_logo_url || null,
    bio: bio || null,
    karma_points: 0,
  });

  // Generate token
  const token = jwt.sign(
    { id: newUser._id, name: newUser.name, role: newUser.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    token,
    user: formatUserPayload(newUser),
  };
};

export const loginUser = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Find user
  const user = await db.User.findOne({ email: normalizedEmail });
  if (!user) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  if (user.is_active === false) {
    throw { status: 403, message: 'This account has been disabled' };
  }

  // Check password
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  // Generate token
  const token = jwt.sign(
    { id: user._id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    token,
    user: formatUserPayload(user),
  };
};

export const getCurrentUser = async (userId) => {
  const user = await db.User.findById(userId).select(
    'name email role account_type organization_name phone sponsor_logo_url bio is_active karma_points'
  );

  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  return formatUserPayload(user);
};

export const getUserProfile = async (userId) => {
  const user = await db.User.findById(userId).select(
    'name email role account_type organization_name phone sponsor_logo_url bio is_active karma_points created_at'
  );

  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  const [createdEvents, joinedEntries, lands, trees] = await Promise.all([
    db.Event.find({ creator_id: userId })
      .select('event_id location date_time current_phase tree_count initiation_type created_at')
      .sort({ created_at: -1 })
      .lean(),
    db.EventVolunteer.find({ user_id: userId })
      .populate('event_id', 'event_id location date_time current_phase tree_count initiation_type')
      .sort({ requested_at: -1 })
      .lean(),
    db.Land.find({ owner_id: userId })
      .select('name address status land_type area_sqft total_trees_planted total_events_hosted created_at')
      .sort({ created_at: -1 })
      .lean(),
    db.Tree.find({
      $or: [{ sponsor_id: userId }, { planted_by: userId }],
    })
      .populate('event_id', 'event_id location')
      .populate('land_id', 'name address')
      .select('tree_id species status growth_status survival_status height_cm sponsor_id planted_by event_id land_id created_at')
      .sort({ created_at: -1 })
      .lean(),
  ]);

  const joinedEvents = joinedEntries
    .filter((entry) => entry.event_id)
    .map((entry) => ({
      ...entry.event_id,
      request_status: entry.request_status,
      contribution_type: entry.contribution_type,
      volunteer_hours: entry.volunteer_hours || 0,
      contribution_amount: entry.contribution_amount || 0,
      requested_at: entry.requested_at,
    }));

  const eventsMap = new Map();
  [...createdEvents, ...joinedEvents].forEach((event) => {
    const key = String(event._id || event.id || event.event_id);
    if (!eventsMap.has(key)) {
      eventsMap.set(key, event);
    }
  });

  return {
    user: formatUserPayload(user),
    joined_events: joinedEvents,
    created_events: createdEvents,
    engaged_events: Array.from(eventsMap.values()),
    lands,
    trees,
    stats: {
      engaged_events: eventsMap.size,
      created_events: createdEvents.length,
      joined_events: joinedEvents.length,
      trees: trees.length,
      lands: lands.length,
    },
  };
};

export const ensureAdminAccount = async () => {
  const config = getAdminSeedConfig();
  if (!config) {
    return null;
  }

  const existing = await db.User.findOne({ email: config.email });

  if (existing) {
    return existing;
  }

  const hashedPassword = await bcrypt.hash(config.password, 10);
  const admin = await db.User.create({
    name: config.name,
    email: config.email,
    password: hashedPassword,
    role: 'Admin',
    account_type: 'Organization',
    organization_name: 'TreeNadu Admin',
    is_active: true,
  });

  console.log(`Admin seed account ready: ${config.email}`);
  return admin;
};
