import db from '../models/index.js';
import { generatePublicId } from '../utils/idGenerator.js';

const logTracking = async (tree, actorId, actionType, title, notes = '', metadata = {}) =>
  db.PlantTracking.create({
    tree_id: tree._id,
    event_id: tree.event_id || null,
    land_id: tree.land_id || null,
    actor_id: actorId || null,
    action_type: actionType,
    title,
    notes,
    metadata,
  });

export const createTree = async (treeData, userId) => {
  const newTree = await db.Tree.create({
    tree_id: generatePublicId('TREE'),
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

  await logTracking(
    newTree,
    userId,
    'PLANNED',
    'Tree added manually',
    'Tree record created from the tree management flow.',
    { species: newTree.species }
  );

  return newTree;
};

// Add Historical Tree
export const createHistoricalTree = async (treeData, userId) => {
  const newTree = await db.Tree.create({
    tree_id: generatePublicId('TREE'),
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

  await logTracking(
    newTree,
    userId,
    'HISTORICAL_IMPORT',
    'Historical tree imported',
    treeData.notes || 'Imported as an existing planted tree.',
    {
      growth_status: newTree.growth_status,
      survival_status: newTree.survival_status,
      height_cm: newTree.height_cm,
    }
  );

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
  tree.tracking = await db.PlantTracking.find({ tree_id: tree._id })
    .populate('actor_id', 'name role account_type organization_name')
    .sort({ tracked_at: -1, created_at: -1 })
    .lean();
  tree.tracking = tree.tracking.map((entry) => ({ ...entry, actor: entry.actor_id }));

  return tree;
};

// 5-step pipeline including Tree Guard
export const addTreeTask = async (treeId, taskType, volunteerId, notes) => {
  const tree = await db.Tree.findById(treeId);
  if (!tree) {
    throw { status: 404, message: 'Tree not found' };
  }

  const wasUnplanted = !tree.planted_date;

  // Create task
  const task = await db.TreeTask.create({
    tree_id: treeId,
    task_type: taskType,
    volunteer_id: volunteerId,
    notes: notes || '',
  });

  // Update tree status based on task
  let newStatus = tree.status;
  let actionType = null;
  let actionTitle = '';

  if (taskType === 'Digging') {
    newStatus = 'Hole-Dug';
    actionType = 'DIGGING';
    actionTitle = 'Digging completed';
  }
  if (taskType === 'Planting') {
    newStatus = 'Planted';
    tree.planted_by = volunteerId;
    tree.planted_date = new Date();
    actionType = 'PLANTING';
    actionTitle = 'Tree planted';
  }
  if (taskType === 'Watering') {
    newStatus = 'Watered';
    tree.last_watered = new Date();
    actionType = 'WATERING';
    actionTitle = 'Tree watered';
  }
  if (taskType === 'Fertilizing') {
    newStatus = 'Fertilized';
    tree.last_fertilized = new Date();
    actionType = 'FERTILIZING';
    actionTitle = 'Fertilizer applied';
  }
  if (taskType === 'TreeGuard') {
    newStatus = 'Guarded';
    tree.has_tree_guard = true;
    actionType = 'GUARDING';
    actionTitle = 'Tree guard installed';
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

  if (actionType) {
    await logTracking(tree, volunteerId, actionType, actionTitle, notes || '', {
      task_type: taskType,
      resulting_status: newStatus,
    });
  }

  if (taskType === 'Planting' && tree.land_id && wasUnplanted) {
    await db.Land.findByIdAndUpdate(tree.land_id, {
      $inc: { total_trees_planted: 1 },
      $set: { status: 'Active' },
    });

    await db.LandActivity.create({
      land_id: tree.land_id,
      user_id: volunteerId,
      activity_type: 'PlantingCompleted',
      description: `${tree.species} planted`,
      metadata: {
        tree_id: tree._id,
        event_id: tree.event_id,
      },
    });
  }

  return task;
};

export const updateTreeHealth = async (treeId, healthData, actorId = null) => {
  const tree = await db.Tree.findById(treeId);
  if (!tree) {
    throw { status: 404, message: 'Tree not found' };
  }

  if (healthData.growth_status) tree.growth_status = healthData.growth_status;
  if (healthData.survival_status) tree.survival_status = healthData.survival_status;
  if (healthData.height_cm !== undefined) tree.height_cm = healthData.height_cm;

  await tree.save();
  await logTracking(
    tree,
    actorId,
    'HEALTH_UPDATE',
    'Health status updated',
    'Growth or survival details were updated for this tree.',
    {
      growth_status: tree.growth_status,
      survival_status: tree.survival_status,
      height_cm: tree.height_cm,
    }
  );
  return tree;
};
