import db from '../models/index.js';
import { generatePublicId } from '../utils/idGenerator.js';
import { createPaginatedResponse } from '../utils/pagination.js';

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

const attachTreeListDetails = async (trees, includeVolunteers = false) => {
  if (trees.length === 0) {
    return trees;
  }

  const treeIds = trees.map((tree) => tree._id);
  const taskQuery = db.TreeTask.find({ tree_id: { $in: treeIds } }).sort({ completed_at: -1 });

  if (includeVolunteers) {
    taskQuery.populate('volunteer_id', 'name');
  }

  const tasks = await taskQuery.lean();
  const tasksByTreeId = new Map();

  for (const task of tasks) {
    const key = String(task.tree_id);
    const normalizedTask = includeVolunteers ? { ...task, volunteer: task.volunteer_id } : task;
    if (!tasksByTreeId.has(key)) {
      tasksByTreeId.set(key, []);
    }
    tasksByTreeId.get(key).push(normalizedTask);
  }

  return trees.map((tree) => ({
    ...tree,
    sponsor: tree.sponsor_id,
    planter: tree.planted_by,
    event: tree.event_id,
    land: tree.land_id,
    tasks: tasksByTreeId.get(String(tree._id)) || [],
  }));
};

const buildTrackedTreeCount = async (query) => {
  const [trackedCount] = await db.Tree.aggregate([
    { $match: query },
    {
      $lookup: {
        from: 'treetasks',
        localField: '_id',
        foreignField: 'tree_id',
        as: 'tasks',
      },
    },
    { $match: { 'tasks.0': { $exists: true } } },
    { $count: 'count' },
  ]);

  return trackedCount?.count || 0;
};

const buildTreeSummary = async (query) => {
  const [total, healthy, mature, tracked] = await Promise.all([
    db.Tree.countDocuments(query),
    db.Tree.countDocuments({ ...query, survival_status: 'Healthy' }),
    db.Tree.countDocuments({ ...query, growth_status: 'Mature' }),
    buildTrackedTreeCount(query),
  ]);

  return {
    total,
    healthy,
    mature,
    tracked,
  };
};

const getTreesPage = async (query, pagination, includeVolunteers = false) => {
  const [trees, total, summary] = await Promise.all([
    db.Tree.find(query)
      .populate('sponsor_id', 'name')
      .populate('planted_by', 'name')
      .populate('event_id', 'event_id location')
      .populate('land_id', 'name')
      .sort({ created_at: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    db.Tree.countDocuments(query),
    buildTreeSummary(query),
  ]);

  const items = await attachTreeListDetails(trees, includeVolunteers);

  return {
    ...createPaginatedResponse({
      items,
      page: pagination.page,
      limit: pagination.limit,
      total,
    }),
    summary,
  };
};

export const getAllTrees = async (pagination) => getTreesPage({}, pagination);

export const getMyTrees = async (userId, pagination) => {
  const taskTreeIds = await db.TreeTask.find({ volunteer_id: userId }).distinct('tree_id');

  return getTreesPage(
    {
      $or: [{ sponsor_id: userId }, { planted_by: userId }, { _id: { $in: taskTreeIds } }],
    },
    pagination,
    true
  );
};

export const getTreesByFilter = async (userId, filter, pagination) => {
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

  return getTreesPage(query, pagination, filter === 'volunteered');
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
  if (healthData.photo_url) tree.photo_url = healthData.photo_url;

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
      evidence_photo_url: healthData.photo_url || null,
    }
  );
  return tree;
};

export const deleteTree = async (treeId, actorId) => {
  const tree = await db.Tree.findById(treeId);
  if (!tree) {
    throw { status: 404, message: 'Tree not found' };
  }

  const actorIdString = String(actorId);
  const canDelete =
    String(tree.planted_by || '') === actorIdString ||
    String(tree.sponsor_id || '') === actorIdString;

  if (!canDelete) {
    const ownedLand = tree.land_id
      ? await db.Land.findOne({ _id: tree.land_id, owner_id: actorId }).select('_id').lean()
      : null;
    const ownsEvent = tree.event_id
      ? await db.Event.findOne({ _id: tree.event_id, creator_id: actorId }).select('_id').lean()
      : null;

    if (!ownedLand && !ownsEvent) {
      throw { status: 403, message: 'You do not have permission to delete this tree' };
    }
  }

  await Promise.all([
    db.TreeTask.deleteMany({ tree_id: treeId }),
    db.PlantTracking.deleteMany({ tree_id: treeId }),
    db.EventVolunteer.updateMany(
      { tree_ids: treeId },
      { $pull: { tree_ids: treeId } }
    ),
    db.Tree.deleteOne({ _id: treeId }),
  ]);

  if (tree.land_id) {
    await db.Land.findByIdAndUpdate(tree.land_id, {
      $inc: { total_trees_planted: -1 },
    });
  }

  return { message: 'Tree deleted successfully' };
};

export const runDailyTreeHealthAudit = async () => {
  const staleCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const staleTrees = await db.Tree.find({
    survival_status: 'Healthy',
    status: { $ne: 'Dead' },
    $or: [{ last_watered: { $exists: false } }, { last_watered: null }, { last_watered: { $lt: staleCutoff } }],
  });

  if (staleTrees.length === 0) {
    return { updated: 0 };
  }

  await Promise.all(
    staleTrees.map(async (tree) => {
      tree.survival_status = 'Weak';
      await tree.save();
      await logTracking(
        tree,
        null,
        'HEALTH_AUDIT',
        'Daily health audit flagged watering risk',
        'Tree was not watered in the last 24 hours and was marked unhealthy automatically.',
        {
          previous_survival_status: 'Healthy',
          new_survival_status: 'Weak',
          last_watered: tree.last_watered || null,
        }
      );
    })
  );

  return { updated: staleTrees.length };
};
