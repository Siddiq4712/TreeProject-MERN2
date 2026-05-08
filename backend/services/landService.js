import db from '../models/index.js';
import { createPaginatedResponse } from '../utils/pagination.js';

export const syncLandDerivedState = async (landId) => {
  if (!landId) {
    return null;
  }

  const land = await db.Land.findById(landId);
  if (!land) {
    return null;
  }

  const [activeEventsCount, totalEventsHosted, plantedTreesCount] = await Promise.all([
    db.Event.countDocuments({
      land_id: landId,
      is_active: { $ne: false },
      current_phase: { $ne: 'COMPLETED' },
    }),
    db.Event.countDocuments({
      land_id: landId,
      is_active: { $ne: false },
    }),
    db.Tree.countDocuments({
      land_id: landId,
      planted_date: { $ne: null },
    }),
  ]);

  land.total_events_hosted = totalEventsHosted;
  land.total_trees_planted = plantedTreesCount;

  if (plantedTreesCount > 0) {
    land.status = 'Active';
  } else if (activeEventsCount > 0) {
    land.status = 'Reserved';
  } else if (land.status !== 'Completed') {
    land.status = 'Available';
  }

  await land.save();
  return land;
};

const attachLandListSummaries = async (lands) => {
  if (lands.length === 0) {
    return lands;
  }

  const landIds = lands.map((land) => land._id);
  const [treeCounts, eventCounts] = await Promise.all([
    db.Tree.aggregate([
      { $match: { land_id: { $in: landIds } } },
      { $group: { _id: '$land_id', count: { $sum: 1 } } },
    ]),
    db.Event.aggregate([
      { $match: { land_id: { $in: landIds } } },
      { $group: { _id: '$land_id', count: { $sum: 1 } } },
    ]),
  ]);

  const treeCountMap = new Map(treeCounts.map((entry) => [String(entry._id), entry.count]));
  const eventCountMap = new Map(eventCounts.map((entry) => [String(entry._id), entry.count]));

  return lands.map((land) => ({
    ...land,
    owner: land.owner_id,
    tree_count: treeCountMap.get(String(land._id)) || 0,
    event_count: eventCountMap.get(String(land._id)) || 0,
  }));
};

export const createLand = async (landData, ownerId) => {
  // Create the land document
  const newLand = await db.Land.create({
    name: landData.name,
    address: landData.address,
    latitude: landData.latitude || null,
    longitude: landData.longitude || null,
    area_sqft: landData.area_sqft || null,
    land_type: landData.land_type || 'Private',
    soil_type: landData.soil_type || undefined, // Use undefined to skip setting the field
    water_availability: landData.water_availability || false,
    water_source: landData.water_source || null,
    description: landData.description || null,
    owner_id: ownerId,
    status: 'Available',
    photos: landData.photos || [],
    total_trees_planted: 0,
    total_events_hosted: 0,
  });

  // Log activity
  await db.LandActivity.create({
    land_id: newLand._id,
    user_id: ownerId,
    activity_type: 'LandAdded',
    description: `Land "${newLand.name}" was added`,
  });

  return newLand;
};


export const getAllLands = async (pagination) => {
  const [lands, total] = await Promise.all([
    db.Land.find()
      .populate('owner_id', 'name')
      .sort({ created_at: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    db.Land.countDocuments(),
  ]);

  const items = await attachLandListSummaries(lands);

  return createPaginatedResponse({
    items,
    page: pagination.page,
    limit: pagination.limit,
    total,
  });
};

export const getMyLands = async (userId, pagination) => {
  const query = { owner_id: userId };
  const [lands, total] = await Promise.all([
    db.Land.find(query)
      .sort({ created_at: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    db.Land.countDocuments(query),
  ]);

  const items = await attachLandListSummaries(lands);

  return createPaginatedResponse({
    items,
    page: pagination.page,
    limit: pagination.limit,
    total,
  });
};

// Get Land Details with ALL related data
export const getLandDetail = async (landId, viewerId) => {
  const land = await db.Land.findById(landId).populate('owner_id', 'name email role').lean();

  if (!land) {
    throw { status: 404, message: 'Land not found' };
  }

  land.owner = land.owner_id;

  // Get trees with related data
  const trees = await db.Tree.find({ land_id: landId })
    .populate('sponsor_id', 'name')
    .populate('planted_by', 'name')
    .lean();

  for (let tree of trees) {
    tree.sponsor = tree.sponsor_id;
    tree.planter = tree.planted_by;
    tree.tasks = await db.TreeTask.find({ tree_id: tree._id }).populate('volunteer_id', 'name').lean();
    tree.tasks = tree.tasks.map((t) => ({ ...t, volunteer: t.volunteer_id }));
  }
  land.trees = trees;

  // Get events with related data
  const events = await db.Event.find({ land_id: landId }).populate('creator_id', 'name').lean();

  for (let event of events) {
    event.creator = event.creator_id;
    event.resources = await db.EventResource.find({ event_id: event._id }).lean();
    event.eventVolunteers = await db.EventVolunteer.find({
      event_id: event._id,
      request_status: 'ACCEPTED',
    })
      .populate('user_id', 'name role')
      .lean();
    event.eventVolunteers = event.eventVolunteers.map((v) => ({ ...v, user: v.user_id }));
  }
  land.events = events;

  // Get activities
  land.activities = await db.LandActivity.find({ land_id: landId })
    .populate('user_id', 'name')
    .sort({ created_at: -1 })
    .limit(50)
    .lean();
  land.activities = land.activities.map((a) => ({ ...a, user: a.user_id }));

  // Is viewer the owner?
  land.is_owner = land.owner_id._id.toString() === viewerId;

  // Tree statistics
  const aliveTrees = trees.filter((t) => t.survival_status !== 'Dead');
  const deadTrees = trees.filter((t) => t.survival_status === 'Dead');
  land.tree_stats = {
    total: trees.length,
    alive: aliveTrees.length,
    dead: deadTrees.length,
    survival_rate: trees.length > 0 ? Math.round((aliveTrees.length / trees.length) * 100) : 0,
  };

  // Species distribution
  const speciesCount = {};
  trees.forEach((tree) => {
    const species = tree.species || 'Unknown';
    speciesCount[species] = (speciesCount[species] || 0) + 1;
  });
  land.species_distribution = Object.entries(speciesCount).map(([species, count]) => ({
    species,
    count,
    percentage: trees.length > 0 ? Math.round((count / trees.length) * 100) : 0,
  }));

  // Collect all volunteers who worked on this land
  const volunteersMap = new Map();
  trees.forEach((tree) => {
    (tree.tasks || []).forEach((task) => {
      if (task.volunteer) {
        const key = task.volunteer._id.toString();
        if (!volunteersMap.has(key)) {
          volunteersMap.set(key, {
            ...task.volunteer,
            tasks: [],
          });
        }
        volunteersMap.get(key).tasks.push(task.task_type);
      }
    });
  });
  land.volunteers = Array.from(volunteersMap.values());

  // Collect all sponsors
  const sponsorsMap = new Map();
  trees.forEach((tree) => {
    if (tree.sponsor) {
      const key = tree.sponsor._id.toString();
      if (!sponsorsMap.has(key)) {
        sponsorsMap.set(key, {
          ...tree.sponsor,
          trees_sponsored: 0,
          species: [],
        });
      }
      sponsorsMap.get(key).trees_sponsored += 1;
      if (!sponsorsMap.get(key).species.includes(tree.species)) {
        sponsorsMap.get(key).species.push(tree.species);
      }
    }
  });
  land.sponsors = Array.from(sponsorsMap.values());

  // Aggregate resources
  const resourcesMap = {
    Saplings: { required: 0, fulfilled: 0 },
    Fertilizer: { required: 0, fulfilled: 0 },
    TreeGuards: { required: 0, fulfilled: 0 },
  };

  events.forEach((event) => {
    (event.resources || []).forEach((r) => {
      if (resourcesMap[r.resource_type]) {
        resourcesMap[r.resource_type].required += r.required_quantity || 0;
        resourcesMap[r.resource_type].fulfilled += r.fulfilled_quantity || 0;
      }
    });
  });

  land.resource_summary = Object.entries(resourcesMap).map(([type, data]) => ({
    type,
    required: data.required,
    fulfilled: data.fulfilled,
    percent: data.required > 0 ? Math.min(100, Math.round((data.fulfilled / data.required) * 100)) : 0,
  }));

  // Current event
  const activeEvent = events.find((e) => e.current_phase !== 'COMPLETED');
  land.current_event = activeEvent || null;

  return land;
};

export const getLandById = async (landId) => {
  const land = await db.Land.findById(landId).populate('owner_id', 'name').lean();

  if (!land) {
    throw { status: 404, message: 'Land not found' };
  }

  land.owner = land.owner_id;
  land.trees = await db.Tree.find({ land_id: landId }).lean();
  land.events = await db.Event.find({ land_id: landId }).lean();

  return land;
};

export const updateLand = async (landId, ownerId, updateData) => {
  const land = await db.Land.findById(landId);

  if (!land) {
    throw { status: 404, message: 'Land not found' };
  }

  if (land.owner_id.toString() !== ownerId) {
    throw { status: 403, message: 'Only land owner can update' };
  }

  const allowedFields = [
    'name',
    'address',
    'latitude',
    'longitude',
    'area_sqft',
    'land_type',
    'soil_type',
    'water_availability',
    'water_source',
    'description',
    'status',
  ];

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      land[field] = updateData[field];
    }
  }

  await land.save();

  // Log activity
  await db.LandActivity.create({
    land_id: landId,
    user_id: ownerId,
    activity_type: 'StatusUpdated',
    description: 'Land details updated',
  });

  return land;
};

export const deleteLand = async (landId, ownerId) => {
  const land = await db.Land.findById(landId);

  if (!land) {
    throw { status: 404, message: 'Land not found' };
  }

  if (land.owner_id.toString() !== ownerId) {
    throw { status: 403, message: 'Only land owner can delete' };
  }

  const [linkedEventsCount, linkedTreesCount] = await Promise.all([
    db.Event.countDocuments({ land_id: landId }),
    db.Tree.countDocuments({ land_id: landId }),
  ]);

  if (linkedEventsCount > 0 || linkedTreesCount > 0) {
    throw {
      status: 400,
      message: 'Cannot delete land that is still linked to events or trees',
    };
  }

  await Promise.all([
    db.LandActivity.deleteMany({ land_id: landId }),
    db.Land.findByIdAndDelete(landId),
  ]);

  return { message: 'Land deleted successfully' };
};

export const addLandPhoto = async (landId, ownerId, photoUrl, caption = '') => {
  const land = await db.Land.findById(landId);

  if (!land) {
    throw { status: 404, message: 'Land not found' };
  }

  if (land.owner_id.toString() !== ownerId) {
    throw { status: 403, message: 'Only land owner can add photos' };
  }

  const photos = land.photos || [];
  photos.push({
    url: photoUrl,
    caption,
    added_at: new Date(),
  });

  land.photos = photos;
  await land.save();

  // Log activity
  await db.LandActivity.create({
    land_id: landId,
    user_id: ownerId,
    activity_type: 'PhotoAdded',
    description: caption || 'New photo added',
  });

  return land;
};

export const addLandActivity = async (landId, userId, activityType, description, metadata = {}) => {
  const activity = await db.LandActivity.create({
    land_id: landId,
    user_id: userId,
    activity_type: activityType,
    description,
    metadata,
  });

  return activity;
};
