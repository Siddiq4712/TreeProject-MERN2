import db from '../models/index.js';

// Generate unique tree ID
const generateTreeId = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `TREE-${random}`;
};

export const createTree = async (treeData, userId) => {
  const newTree = await db.Tree.create({
    tree_id: generateTreeId(),
    species: treeData.species,
    event_id: treeData.event_id || null,
    land_id: treeData.land_id || null,
    sponsor_id: treeData.sponsor_id || null,
    planted_by: userId,
    status: 'Planned',
    growth_status: 'Seedling',
    survival_status: 'Healthy',
    is_historical: false,
  });

  return newTree;
};

// Add Historical Tree
export const createHistoricalTree = async (treeData, userId) => {
  const newTree = await db.Tree.create({
    tree_id: generateTreeId(),
    species: treeData.species,
    land_id: treeData.land_id || null,
    sponsor_id: treeData.sponsor_id || userId,
    planted_by: userId,
    planted_date: treeData.planted_date || new Date(),
    status: 'Growing',
    growth_status: treeData.growth_status || 'Sapling',
    survival_status: treeData.survival_status || 'Healthy',
    height_cm: treeData.height_cm || 0,
    is_historical: true,
    historical_planted_date: treeData.planted_date,
    photo_url: treeData.photo_url || null,
    notes: treeData.notes || null,
    has_tree_guard: treeData.has_tree_guard || false,
  });

  return newTree;
};

export const getAllTrees = async () => {
  const trees = await db.Tree.find()
    .populate('sponsor_id', 'name')
    .populate('planted_by', 'name')
    .populate('event_id', 'event_id location')
    .populate('land_id', 'name')
    .sort({ created_at: -1 })
    .lean();

  for (let tree of trees) {
    tree.sponsor = tree.sponsor_id;
    tree.planter = tree.planted_by;
    tree.event = tree.event_id;
    tree.land = tree.land_id;
    tree.tasks = await db.TreeTask.find({ tree_id: tree._id }).lean();
  }

  return trees;
};

export const getMyTrees = async (userId) => {
  const taskTreeIds = await db.TreeTask.find({ volunteer_id: userId }).distinct('tree_id');

  const trees = await db.Tree.find({
    $or: [{ sponsor_id: userId }, { planted_by: userId }, { _id: { $in: taskTreeIds } }],
  })
    .populate('sponsor_id', 'name')
    .populate('planted_by', 'name')
    .populate('event_id', 'event_id location')
    .populate('land_id', 'name')
    .sort({ created_at: -1 })
    .lean();

  for (let tree of trees) {
    tree.sponsor = tree.sponsor_id;
    tree.planter = tree.planted_by;
    tree.event = tree.event_id;
    tree.land = tree.land_id;
    tree.tasks = await db.TreeTask.find({ tree_id: tree._id })
      .populate('volunteer_id', 'name')
      .lean();
    tree.tasks = tree.tasks.map((t) => ({ ...t, volunteer: t.volunteer_id }));
  }

  return trees;
};

export const getTreesByFilter = async (userId, filter) => {
  let query = {};

  if (filter === 'volunteered') {
    const taskTreeIds = await db.TreeTask.find({ volunteer_id: userId }).distinct('tree_id');
    query = { _id: { $in: taskTreeIds } };
  } else if (filter === 'sponsored') {
    query = { sponsor_id: userId };
  } else if (filter === 'planted') {
    query = { planted_by: userId };
  } else if (filter === 'historical') {
    query = { is_historical: true, planted_by: userId };
  }

  const trees = await db.Tree.find(query)
    .populate('sponsor_id', 'name')
    .populate('planted_by', 'name')
    .populate('event_id', 'event_id location')
    .sort({ created_at: -1 })
    .lean();

  for (let tree of trees) {
    tree.sponsor = tree.sponsor_id;
    tree.planter = tree.planted_by;
    tree.event = tree.event_id;
    tree.tasks = await db.TreeTask.find({ tree_id: tree._id }).lean();
  }

  return trees;
};

export const getTreeById = async (treeId) => {
  const tree = await db.Tree.findById(treeId)
    .populate('sponsor_id', 'name')
    .populate('planted_by', 'name')
    .populate('event_id')
    .populate('land_id')
    .lean();

  if (!tree) {
    throw { status: 404, message: 'Tree not found' };
  }

  tree.sponsor = tree.sponsor_id;
  tree.planter = tree.planted_by;
  tree.event = tree.event_id;
  tree.land = tree.land_id;
  tree.tasks = await db.TreeTask.find({ tree_id: tree._id }).populate('volunteer_id', 'name').lean();
  tree.tasks = tree.tasks.map((t) => ({ ...t, volunteer: t.volunteer_id }));

  return tree;
};

// 5-step pipeline including Tree Guard
export const addTreeTask = async (treeId, taskType, volunteerId, notes) => {
  const tree = await db.Tree.findById(treeId);
  if (!tree) {
    throw { status: 404, message: 'Tree not found' };
  }

  // Create task
  const task = await db.TreeTask.create({
    tree_id: treeId,
    task_type: taskType,
    volunteer_id: volunteerId,
    notes: notes || '',
  });

  // Update tree status based on task
  let newStatus = tree.status;

  if (taskType === 'Digging') {
    newStatus = 'Hole-Dug';
  }
  if (taskType === 'Planting') {
    newStatus = 'Planted';
    tree.planted_by = volunteerId;
    tree.planted_date = new Date();
  }
  if (taskType === 'Watering') {
    newStatus = 'Watered';
    tree.last_watered = new Date();
  }
  if (taskType === 'Fertilizing') {
    newStatus = 'Fertilized';
    tree.last_fertilized = new Date();
  }
  if (taskType === 'TreeGuard') {
    newStatus = 'Guarded';
    tree.has_tree_guard = true;
  }

  // Check if all 5 steps done
  const allTasks = await db.TreeTask.find({ tree_id: treeId });
  const taskTypes = allTasks.map((t) => t.task_type);
  const hasAllSteps =
    taskTypes.includes('Digging') &&
    taskTypes.includes('Planting') &&
    taskTypes.includes('Watering') &&
    taskTypes.includes('Fertilizing') &&
    taskTypes.includes('TreeGuard');

  if (hasAllSteps) {
    newStatus = 'Growing';
  }

  tree.status = newStatus;
  await tree.save();

  return task;
};

export const updateTreeHealth = async (treeId, healthData) => {
  const tree = await db.Tree.findById(treeId);
  if (!tree) {
    throw { status: 404, message: 'Tree not found' };
  }

  if (healthData.growth_status) tree.growth_status = healthData.growth_status;
  if (healthData.survival_status) tree.survival_status = healthData.survival_status;
  if (healthData.height_cm) tree.height_cm = healthData.height_cm;

  await tree.save();
  return tree;
};