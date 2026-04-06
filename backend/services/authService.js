import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';

export const registerUser = async (name, email, password, role) => {
  // Check if user exists
  const existingUser = await db.User.findOne({ email });
  if (existingUser) {
    throw { status: 409, message: 'Email already in use' };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const newUser = await db.User.create({
    name,
    email,
    password: hashedPassword,
    role: role || 'Volunteer',
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
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      karma_points: newUser.karma_points,
    },
  };
};

export const loginUser = async (email, password) => {
  // Find user
  const user = await db.User.findOne({ email });
  if (!user) {
    throw { status: 401, message: 'Invalid email or password' };
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
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      karma_points: user.karma_points,
    },
  };
};

export const getCurrentUser = async (userId) => {
  const user = await db.User.findById(userId).select('name email role karma_points');

  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    karma_points: user.karma_points,
  };
};