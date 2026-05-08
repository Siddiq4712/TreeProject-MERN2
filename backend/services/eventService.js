import db from '../models/index.js';
import mongoose from 'mongoose';
import { generatePublicId } from '../utils/idGenerator.js';
import { createPaginatedResponse } from '../utils/pagination.js';
import { syncLandDerivedState } from './landService.js';

const logPlantTracking = async (tree, actorId, actionType, title, notes = '', metadata = {}, session = null) =>
  db.PlantTracking.create({
    tree_id: tree._id,
    event_id: tree.event_id || null,
    land_id: tree.land_id || null,
    actor_id: actorId || null,
    action_type: actionType,
    title,
    notes,
    metadata,
  }, { session });

const createEventTrees = async (event, creatorId) => {
  let land = null;
  if (event.land_id) {
    land = await db.Land.findById(event.land_id).lean();
  }

  const trees = await db.Tree.insertMany(
    Array.from({ length: event.tree_count }, (_, index) => ({
      tree_id: generatePublicId(`TREE${index + 1}`),
      species: event.tree_species || 'Mixed',
      event_id: event._id,
      land_id: event.land_id || null,
      latitude: land?.latitude || event.proposed_land?.latitude || null,
      longitude: land?.longitude || event.proposed_land?.longitude || null,
      spot_label: `Spot ${index + 1}`,
      planted_by: creatorId,
      status: 'Planned',
      growth_status: 'Seedling',
      survival_status: 'Healthy',
      maintenance_due_at: event.date_time ? new Date(new Date(event.date_time).getTime() + 7 * 24 * 60 * 60 * 1000) : null,
      notes: `Planned for event ${event.event_id}`,
    }))
  );

  await Promise.all(
    trees.map((tree, index) =>
      logPlantTracking(
        tree,
        creatorId,
        'PLANNED',
        `Tree ${index + 1} planned for ${event.event_id}`,
        'Created automatically when the event was scheduled.',
        {
          event_id: event.event_id,
          species: tree.species,
        }
      )
    )
  );

  return trees;
};

const computeResourceStatus = (resource) => {
  const amountComplete =
    Number(resource.required_amount || 0) > 0 &&
    Number(resource.fulfilled_amount || 0) >= Number(resource.required_amount || 0);
  const quantityComplete =
    Number(resource.required_quantity || 0) > 0 &&
    Number(resource.fulfilled_quantity || 0) >= Number(resource.required_quantity || 0);

  if (amountComplete || quantityComplete) {
    return 'Complete';
  }

  const hasAnyProgress =
    Number(resource.fulfilled_amount || 0) > 0 || Number(resource.fulfilled_quantity || 0) > 0;

  return hasAnyProgress ? 'Partial' : 'Pending';
};

const syncEventTreeRecords = async (event, creatorId, session = null) => {
  const land = event.land_id ? await db.Land.findById(event.land_id).session(session).lean() : null;
  const latitude = land?.latitude || event.proposed_land?.latitude || null;
  const longitude = land?.longitude || event.proposed_land?.longitude || null;
  const trees = await db.Tree.find({ event_id: event._id }).sort({ created_at: 1 }).session(session);
  const currentCount = trees.length;
  const targetCount = Number(event.tree_count || 0);
  const plannedSpecies = event.tree_species || 'Mixed';

  if (currentCount < targetCount) {
    const treesToAdd = await db.Tree.insertMany(
      Array.from({ length: targetCount - currentCount }, (_, index) => ({
        tree_id: generatePublicId(`TREE${currentCount + index + 1}`),
        species: plannedSpecies,
        event_id: event._id,
        land_id: event.land_id || null,
        latitude,
        longitude,
        spot_label: `Spot ${currentCount + index + 1}`,
        planted_by: creatorId,
        status: 'Planned',
        growth_status: 'Seedling',
        survival_status: 'Healthy',
        maintenance_due_at: event.date_time ? new Date(new Date(event.date_time).getTime() + 7 * 24 * 60 * 60 * 1000) : null,
        notes: `Planned for event ${event.event_id}`,
      })),
      { session }
    );

    await Promise.all(
      treesToAdd.map((tree, index) =>
        logPlantTracking(
          tree,
          creatorId,
          'PLANNED',
          `Tree ${currentCount + index + 1} planned for ${event.event_id}`,
          'Created automatically when the event was edited.',
          {
            event_id: event.event_id,
            species: tree.species,
          },
          session
        )
      )
    );
  }

  if (currentCount > targetCount) {
    const removalCount = currentCount - targetCount;
    const removableTrees = trees.filter((tree) => tree.status === 'Planned');

    if (removableTrees.length < removalCount) {
      throw { status: 400, message: 'Tree count cannot be reduced below the number of active tracked trees' };
    }

    const removableTreeIds = removableTrees.slice(0, removalCount).map((tree) => tree._id);
    await Promise.all([
      db.TreeTask.deleteMany({ tree_id: { $in: removableTreeIds } }).session(session),
      db.PlantTracking.deleteMany({ tree_id: { $in: removableTreeIds } }).session(session),
      db.EventVolunteer.updateMany(
        { tree_ids: { $in: removableTreeIds } },
        { $pull: { tree_ids: { $in: removableTreeIds } } }
      ).session(session),
      db.Tree.deleteMany({ _id: { $in: removableTreeIds } }).session(session),
    ]);
  }

  await db.Tree.updateMany(
    { event_id: event._id, status: 'Planned' },
    {
      $set: {
        species: plannedSpecies,
        land_id: event.land_id || null,
        latitude,
        longitude,
        notes: `Planned for event ${event.event_id}`,
      },
    }
  ).session(session);
};

const suggestTreeTypes = ({ tree_species, climate_zone, soil_type, water_availability }) => {
  if (tree_species) {
    return tree_species
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const suggestions = new Set(['Neem', 'Pongamia']);

  if (soil_type === 'Clay' || soil_type === 'Loamy') {
    suggestions.add('Peepal');
    suggestions.add('Banyan');
  }

  if (soil_type === 'Sandy') {
    suggestions.add('Casuarina');
    suggestions.add('Palm');
  }

  if (water_availability) {
    suggestions.add('Jamun');
    suggestions.add('Mango');
  }

  if (climate_zone?.toLowerCase().includes('dry')) {
    suggestions.add('Tamarind');
  }

  return Array.from(suggestions);
};

const isBlank = (value) => typeof value !== 'string' || value.trim().length === 0;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s-]{10,15}$/;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THREE_DAY_MS = 3 * ONE_DAY_MS;
const VALID_HARD_TASKS = ['Digging', 'Planting', 'Watering', 'Fertilizing', 'TreeGuard'];
const VALID_SOFT_TASKS = ['SocialMedia', 'Awareness', 'Photography', 'Coordination'];
const VALID_RESOURCE_TYPES = ['Land', 'Saplings', 'Fertilizer', 'TreeGuards', 'General'];
const VALID_PROCUREMENT_TYPES = ['Fund', 'Procure'];

const ensureValidCoordinate = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
const buildDefaultJoinDeadline = (eventDate) => new Date(new Date(eventDate).getTime() - ONE_DAY_MS);

const resolveEffectiveJoinDeadline = (event) => {
  if (!event?.date_time) {
    return event?.join_deadline ? new Date(event.join_deadline) : null;
  }

  const eventDate = new Date(event.date_time);
  if (Number.isNaN(eventDate.getTime())) {
    return event?.join_deadline ? new Date(event.join_deadline) : null;
  }

  const defaultJoinDeadline = buildDefaultJoinDeadline(eventDate);
  if (!event.join_deadline) {
    return defaultJoinDeadline;
  }

  const storedJoinDeadline = new Date(event.join_deadline);
  if (Number.isNaN(storedJoinDeadline.getTime())) {
    return defaultJoinDeadline;
  }

  const diff = eventDate.getTime() - storedJoinDeadline.getTime();
  if (Math.abs(diff - THREE_DAY_MS) < 60 * 1000) {
    return defaultJoinDeadline;
  }

  return storedJoinDeadline;
};

const syncEffectiveJoinDeadline = async (event) => {
  const effectiveJoinDeadline = resolveEffectiveJoinDeadline(event);
  if (!effectiveJoinDeadline) {
    return null;
  }

  const currentJoinDeadline = event.join_deadline ? new Date(event.join_deadline) : null;
  const shouldUpdate =
    !currentJoinDeadline ||
    Number.isNaN(currentJoinDeadline.getTime()) ||
    Math.abs(currentJoinDeadline.getTime() - effectiveJoinDeadline.getTime()) >= 60 * 1000;

  if (shouldUpdate) {
    event.join_deadline = effectiveJoinDeadline;
    if (typeof event.save === 'function') {
      await event.save();
    }
  }

  return effectiveJoinDeadline;
};

const upsertEventResources = async (event, treeCount, session = null) => {
  const resourceConfigs = [
    {
      type: 'Land',
      required_quantity: 1,
      required_amount: event.land_id ? 0 : 5000,
      fulfilled_quantity: event.land_id ? 1 : 0,
      fulfilled_amount: event.land_id ? 0 : 0,
      status: event.land_id ? 'Complete' : 'Pending',
    },
    {
      type: 'Saplings',
      required_quantity: treeCount,
      required_amount: treeCount * 20,
    },
    {
      type: 'Fertilizer',
      required_quantity: treeCount,
      required_amount: treeCount * 5,
    },
    {
      type: 'TreeGuards',
      required_quantity: treeCount,
      required_amount: treeCount * 10,
    },
  ];

  for (const config of resourceConfigs) {
    let resource = await db.EventResource.findOne({ event_id: event._id, resource_type: config.type }).session(session);
    if (!resource) {
      resource = new db.EventResource({
        event_id: event._id,
        resource_type: config.type,
        required_quantity: config.required_quantity,
        fulfilled_quantity: config.fulfilled_quantity || 0,
        required_amount: config.required_amount,
        fulfilled_amount: config.fulfilled_amount || 0,
        status: config.status || 'Pending',
      });
      await resource.save({ session });
      continue;
    }

    resource.required_quantity = config.required_quantity;
    resource.required_amount = config.required_amount;

    if (config.type === 'Land') {
      resource.fulfilled_quantity = config.fulfilled_quantity || 0;
      resource.fulfilled_amount = config.fulfilled_amount || 0;
      resource.status = config.status || 'Pending';
      if (!event.land_id) {
        resource.notes = event.proposed_land?.latitude && event.proposed_land?.longitude
          ? 'Volunteers can suggest land for this event.'
          : resource.notes;
      }
    } else {
      resource.status = computeResourceStatus(resource);
    }

    await resource.save({ session });
  }
};

const attachEventListDetails = async (events, includeAllRequests = false) => {
  if (events.length === 0) {
    return events;
  }

  const eventIds = events.map((event) => event._id);
  const volunteerQuery = includeAllRequests
    ? { event_id: { $in: eventIds } }
    : { event_id: { $in: eventIds }, request_status: 'ACCEPTED' };

  const [resources, trees, volunteers] = await Promise.all([
    db.EventResource.find({ event_id: { $in: eventIds } }).lean(),
    db.Tree.find({ event_id: { $in: eventIds } }).select('tree_id species status event_id').lean(),
    db.EventVolunteer.find(volunteerQuery).populate('user_id', 'name role email').lean(),
  ]);

  const resourcesByEventId = new Map();
  const treesByEventId = new Map();
  const volunteersByEventId = new Map();

  for (const resource of resources) {
    const key = String(resource.event_id);
    if (!resourcesByEventId.has(key)) {
      resourcesByEventId.set(key, []);
    }
    resourcesByEventId.get(key).push(resource);
  }

  for (const tree of trees) {
    const key = String(tree.event_id);
    if (!treesByEventId.has(key)) {
      treesByEventId.set(key, []);
    }
    treesByEventId.get(key).push(tree);
  }

  for (const volunteer of volunteers) {
    const key = String(volunteer.event_id);
    const normalizedVolunteer = { ...volunteer, user: volunteer.user_id };
    if (!volunteersByEventId.has(key)) {
      volunteersByEventId.set(key, []);
    }
    volunteersByEventId.get(key).push(normalizedVolunteer);
  }

  return events.map((event) => {
    const eventVolunteers = volunteersByEventId.get(String(event._id)) || [];
    const enrichedEvent = {
      ...event,
      creator: event.creator_id,
      land: event.land_id,
      resources: resourcesByEventId.get(String(event._id)) || [],
      trees: treesByEventId.get(String(event._id)) || [],
      eventVolunteers,
    };

    if (includeAllRequests) {
      enrichedEvent.pending_requests = eventVolunteers.filter((v) => v.request_status === 'PENDING').length;
      enrichedEvent.accepted_requests = eventVolunteers.filter((v) => v.request_status === 'ACCEPTED').length;
      enrichedEvent.rejected_requests = eventVolunteers.filter((v) => v.request_status === 'REJECTED').length;
    }

    return enrichedEvent;
  });
};

const getEventsPage = async (query, pagination, options = {}) => {
  const { includeAllRequests = false } = options;
  const [events, total] = await Promise.all([
    db.Event.find(query)
      .populate('creator_id', 'name role account_type organization_name')
      .populate('land_id', 'name address')
      .sort({ created_at: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    db.Event.countDocuments(query),
  ]);

  const items = await attachEventListDetails(events, includeAllRequests);

  return createPaginatedResponse({
    items,
    page: pagination.page,
    limit: pagination.limit,
    total,
  });
};

// Create Event
export const createEvent = async (eventData, creatorId) => {
  const treeCount = Number(eventData.tree_count);
  const budget = Number(eventData.budget);
  const expectedVolunteers = Number(eventData.expected_volunteers);
  const pinCode = String(eventData.pin_code || '').trim();
  const eventId = String(eventData.event_id || '').trim();
  const location = String(eventData.location || '').trim();
  const locationCode = String(eventData.location_code || '').trim();
  const description = String(eventData.description || '').trim();
  const treeSpecies = String(eventData.tree_species || '').trim();
  const maintenancePlan = String(eventData.maintenance_plan || '').trim();
  const communityStrategy = String(eventData.community_engagement_strategy || '').trim();
  const creatorName = String(eventData.contact_person?.name || '').trim();
  const organizationName = String(eventData.contact_person?.organization || '').trim();
  const contactPhone = String(eventData.contact_person?.phone || '').trim();
  const contactEmail = String(eventData.contact_person?.email || '').trim();
  const climateZone = String(eventData.climate_zone || '').trim();
  const joinDeadline = eventData.join_deadline ? new Date(eventData.join_deadline) : null;
  const eventDate = eventData.date_time ? new Date(eventData.date_time) : null;
  const socialMediaHandles = Array.isArray(eventData.social_media_handles)
    ? Array.from(new Set(eventData.social_media_handles.map((item) => String(item || '').trim()).filter(Boolean)))
    : [];

  if (
    isBlank(eventId) ||
    isBlank(location) ||
    isBlank(pinCode) ||
    !eventDate ||
    !Number.isInteger(treeCount) ||
    treeCount <= 0 ||
    isBlank(description) ||
    isBlank(treeSpecies) ||
    !Number.isFinite(budget) ||
    budget < 0 ||
    !eventData.role ||
    !eventData.initiation_type ||
    !eventData.approval_mode ||
    !eventData.land_allocation_status ||
    !Number.isFinite(expectedVolunteers) ||
    expectedVolunteers < 0 ||
    !Number.isInteger(expectedVolunteers) ||
    isBlank(maintenancePlan) ||
    typeof eventData.media_coverage !== 'boolean' ||
    isBlank(creatorName) ||
    isBlank(organizationName) ||
    isBlank(contactPhone) ||
    isBlank(contactEmail) ||
    isBlank(climateZone) ||
    typeof eventData.can_run_without_sponsorship !== 'boolean' ||
    !eventData.procurement_status
  ) {
    throw { status: 400, message: 'Please fill all required event fields before creating the event' };
  }

  if (!/^\d{6}$/.test(pinCode)) {
    throw { status: 400, message: 'PIN code must be exactly 6 digits' };
  }

  if (!new RegExp(`^${pinCode}-\\d{16}$`).test(eventId)) {
    throw { status: 400, message: 'Event ID must start with the PIN code and end with a 16-digit unique ID' };
  }

  if (locationCode !== pinCode) {
    throw { status: 400, message: 'Location code must match the PIN code' };
  }

  if (Number.isNaN(eventDate.getTime()) || eventDate <= new Date()) {
    throw { status: 400, message: 'Event date must be a valid future date and time' };
  }

  if (joinDeadline && (Number.isNaN(joinDeadline.getTime()) || joinDeadline >= eventDate)) {
    throw { status: 400, message: 'Join deadline must be earlier than the event date' };
  }

  if (!EMAIL_REGEX.test(contactEmail)) {
    throw { status: 400, message: 'Contact email is not valid' };
  }

  if (!PHONE_REGEX.test(contactPhone)) {
    throw { status: 400, message: 'Contact phone number is not valid' };
  }

  if (eventData.land_allocation_status === 'ALLOCATED' && !eventData.land_id) {
    throw { status: 400, message: 'Allocated events must include a selected land' };
  }

  if (eventData.land_allocation_status === 'NEEDED' && eventData.land_id) {
    throw { status: 400, message: 'Land should not be pre-selected when allocation is still needed' };
  }

  const calculatedFundingGoal =
    treeCount * 20 + // Saplings
    treeCount * 5 + // Fertilizer
    treeCount * 10 + // Guards
    (eventData.land_id ? 0 : 5000); // Land

  // Set default join deadline to 1 day before event
  let normalizedJoinDeadline = joinDeadline;
  if (!normalizedJoinDeadline && eventData.date_time) {
    normalizedJoinDeadline = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
  }

  const selectedLand = eventData.land_id ? await db.Land.findById(eventData.land_id).lean() : null;

  if (eventData.land_id && !selectedLand) {
    throw { status: 400, message: 'Selected land does not exist' };
  }

  if (selectedLand && String(selectedLand.owner_id) !== String(creatorId)) {
    throw { status: 403, message: 'You can only create events using your own land entries' };
  }

  const proposedLand = eventData.proposed_land || null;
  if (proposedLand?.latitude !== null && proposedLand?.latitude !== undefined) {
    const latitude = Number(proposedLand.latitude);
    if (!ensureValidCoordinate(latitude, -90, 90)) {
      throw { status: 400, message: 'Proposed land latitude is invalid' };
    }
  }

  if (proposedLand?.longitude !== null && proposedLand?.longitude !== undefined) {
    const longitude = Number(proposedLand.longitude);
    if (!ensureValidCoordinate(longitude, -180, 180)) {
      throw { status: 400, message: 'Proposed land longitude is invalid' };
    }
  }

  if (proposedLand?.area_sqft !== null && proposedLand?.area_sqft !== undefined) {
    const area = Number(proposedLand.area_sqft);
    if (!Number.isFinite(area) || area <= 0) {
      throw { status: 400, message: 'Proposed land area must be a positive number' };
    }
  }

  const treeSuggestions = suggestTreeTypes({
    tree_species: treeSpecies,
    climate_zone: climateZone,
    soil_type: selectedLand?.soil_type,
    water_availability: selectedLand?.water_availability,
  });

  const newEvent = await db.Event.create({
    event_id: eventId,
    location,
    pin_code: pinCode,
    description,
    date_time: eventDate,
    join_deadline: normalizedJoinDeadline,
    tree_count: treeCount,
    tree_species: treeSpecies,
    budget,
    role: eventData.role,
    creator_id: creatorId,
    land_id: eventData.land_id || null,
    location_code: pinCode,
    initiation_type: eventData.initiation_type,
    approval_mode: eventData.approval_mode,
    funding_goal: eventData.funding_goal || calculatedFundingGoal,
    funding_fulfilled: 0,
    labor_goal: eventData.labor_goal || Math.ceil(treeCount / 5),
    labor_fulfilled: 0,
    current_phase: 'WAITING_RESOURCES',
    is_ready_to_start: false,
    is_active: true,
    banner_url: eventData.banner_url || null,
    land_allocation_status: eventData.land_allocation_status,
    proposed_land: proposedLand,
    land_support_options: eventData.land_support_options || [],
    land_support_other: eventData.land_support_other || null,
    can_run_without_sponsorship: !!eventData.can_run_without_sponsorship,
    expected_volunteers: expectedVolunteers,
    maintenance_plan: maintenancePlan,
    community_engagement_strategy: communityStrategy || null,
    media_coverage: !!eventData.media_coverage,
    social_media_handles: socialMediaHandles,
    contact_person: {
      name: creatorName,
      organization: organizationName,
      phone: contactPhone,
      email: contactEmail,
    },
    climate_zone: climateZone,
    suggested_tree_types: treeSuggestions,
    procurement_status: eventData.procurement_status,
  });

  // Create resource requirements
  const resourceConfigs = [
    {
      type: 'Land',
      required_quantity: 1,
      required_amount: eventData.land_id ? 0 : 5000,
      status: eventData.land_id ? 'Complete' : 'Pending',
    },
    { type: 'Saplings', required_quantity: treeCount, required_amount: treeCount * 20, status: 'Pending' },
    { type: 'Fertilizer', required_quantity: treeCount, required_amount: treeCount * 5, status: 'Pending' },
    { type: 'TreeGuards', required_quantity: treeCount, required_amount: treeCount * 10, status: 'Pending' },
  ];

  for (const config of resourceConfigs) {
    await db.EventResource.create({
      event_id: newEvent._id,
      resource_type: config.type,
      required_quantity: config.required_quantity,
      fulfilled_quantity: config.status === 'Complete' ? config.required_quantity : 0,
      required_amount: config.required_amount,
      fulfilled_amount: config.status === 'Complete' ? config.required_amount : 0,
      status: config.status,
    });
  }

  await createEventTrees(newEvent, creatorId);

  if (newEvent.land_id) {
    await db.LandActivity.create({
      land_id: newEvent.land_id,
      user_id: creatorId,
      activity_type: 'EventCreated',
      description: `Event ${newEvent.event_id} scheduled on this land`,
      metadata: {
        event_id: newEvent._id,
        tree_count: newEvent.tree_count,
      },
    });

    await syncLandDerivedState(newEvent.land_id);
  }

  if (!newEvent.land_id && eventData.proposed_land?.latitude && eventData.proposed_land?.longitude) {
    const volunteerLandResource = await db.EventResource.findOne({
      event_id: newEvent._id,
      resource_type: 'Land',
    });
    if (volunteerLandResource) {
      volunteerLandResource.notes = 'Volunteers can suggest land for this event.';
      await volunteerLandResource.save();
    }
  }

  return newEvent;
};

// Get All Events (EXCLUDE creator's own events)
export const getAllEvents = async (userId, pagination) =>
  getEventsPage(
    {
      creator_id: { $ne: userId },
      is_active: true,
    },
    pagination
  );

// Get My Created Events
export const getMyCreatedEvents = async (userId, pagination) =>
  getEventsPage({ creator_id: userId, is_active: { $ne: false } }, pagination, { includeAllRequests: true });

// Get Event By ID
export const getEventById = async (eventId) => {
  const event = await db.Event.findById(eventId)
    .populate('creator_id', 'name role account_type organization_name')
    .populate('land_id')
    .lean();

  if (!event) return null;

  event.join_deadline = resolveEffectiveJoinDeadline(event);

  event.creator = event.creator_id;
  event.land = event.land_id;
  event.resources = await db.EventResource.find({ event_id: event._id }).lean();
  event.trees = await db.Tree.find({ event_id: event._id }).lean();
  event.tracked_tree_count = event.trees.length;
  event.eventVolunteers = await db.EventVolunteer.find({ event_id: event._id })
    .populate('user_id', 'name role email')
    .lean();

  event.eventVolunteers = event.eventVolunteers.map((v) => ({
    ...v,
    user: v.user_id,
  }));

  return event;
};

// Get Event Detail with Role Context
export const getEventDetail = async (eventId, viewerId) => {
  const event = await db.Event.findById(eventId)
    .populate('creator_id', 'name role email account_type organization_name')
    .populate('land_id')
    .lean();

  if (!event) {
    throw { status: 404, message: 'Event not found' };
  }

  event.join_deadline = resolveEffectiveJoinDeadline(event);

  event.creator = event.creator_id;
  event.land = event.land_id;
  event.resources = await db.EventResource.find({ event_id: event._id }).lean();
  event.trees = await db.Tree.find({ event_id: event._id }).lean();
  event.tracked_tree_count = event.trees.length;
  event.eventVolunteers = await db.EventVolunteer.find({ event_id: event._id })
    .populate('user_id', 'name role karma_points')
    .lean();

  event.eventVolunteers = event.eventVolunteers.map((v) => ({
    ...v,
    user: v.user_id,
  }));

  // Add role context
  event.is_creator = event.creator_id._id.toString() === viewerId;

  // Check if viewer has already requested/joined
  const viewerRequest = event.eventVolunteers?.find((v) => v.user_id._id.toString() === viewerId);
  event.viewer_request_status = viewerRequest?.request_status || null;
  event.viewer_contribution_type = viewerRequest?.contribution_type || null;

  // Check if join deadline passed
  event.is_join_closed = event.join_deadline && new Date(event.join_deadline) < new Date();

  // Separate accepted volunteers and sponsors
  const acceptedVolunteers =
    event.eventVolunteers?.filter((v) => v.request_status === 'ACCEPTED' && v.contribution_type === 'Labor') || [];

  const acceptedSponsors =
    event.eventVolunteers?.filter((v) => v.request_status === 'ACCEPTED' && v.contribution_type === 'Capital') || [];

  event.accepted_volunteers = acceptedVolunteers;
  event.accepted_sponsors = acceptedSponsors;
  event.pending_requests_count = event.eventVolunteers?.filter((v) => v.request_status === 'PENDING').length || 0;
  event.organization_ready =
    event.creator?.account_type === 'Organization' || event.creator?.role === 'Organizer';
  event.volunteer_hours = event.eventVolunteers?.reduce((sum, item) => sum + Number(item.volunteer_hours || 0), 0) || 0;

  // Calculate resource progress
  const resources = event.resources || [];
  event.resource_summary = resources.map((r) => ({
    type: r.resource_type,
    required: r.required_quantity || r.required_amount,
    fulfilled: r.fulfilled_quantity || r.fulfilled_amount,
    status: r.status,
    percent:
      r.required_amount > 0
        ? Math.min(100, Math.round((r.fulfilled_amount / r.required_amount) * 100))
        : Math.min(100, Math.round((r.fulfilled_quantity / r.required_quantity) * 100)),
  }));

  return event;
};

// Get Event Requests
export const getEventRequests = async (eventId, creatorId, status = null) => {
  const event = await db.Event.findById(eventId);

  if (!event) {
    throw { status: 404, message: 'Event not found' };
  }

  if (event.creator_id.toString() !== creatorId) {
    throw { status: 403, message: 'Only event creator can view requests' };
  }

  const query = { event_id: eventId };
  if (status) {
    query.request_status = status;
  }

  const requests = await db.EventVolunteer.find(query)
    .populate('user_id', 'name role email karma_points')
    .sort({ requested_at: -1 })
    .lean();

  return requests.map((r) => ({
    ...r,
    user: r.user_id,
  }));
};

// Apply contribution internally
const applyContributionInternal = async (event, volunteer) => {
  if (volunteer.contribution_type === 'Labor') {
    event.labor_fulfilled += 1;
  } else if (volunteer.contribution_type === 'Capital') {
    if (volunteer.contribution_amount) {
      event.funding_fulfilled = parseFloat(event.funding_fulfilled) + parseFloat(volunteer.contribution_amount);
    }

    if (volunteer.resource_type) {
      const resource = await db.EventResource.findOne({
        event_id: event._id,
        resource_type: volunteer.resource_type,
      });

      if (resource) {
        if (volunteer.procurement_type === 'Fund') {
          resource.fulfilled_amount = parseFloat(resource.fulfilled_amount) + parseFloat(volunteer.contribution_amount || 0);
        } else if (volunteer.procurement_type === 'Procure') {
          resource.fulfilled_quantity += volunteer.contribution_quantity || 0;
        }

        const amountComplete = parseFloat(resource.fulfilled_amount) >= parseFloat(resource.required_amount);
        const quantityComplete = resource.fulfilled_quantity >= resource.required_quantity;

        if (amountComplete || quantityComplete) {
          resource.status = 'Complete';
        } else if (parseFloat(resource.fulfilled_amount) > 0 || resource.fulfilled_quantity > 0) {
          resource.status = 'Partial';
        }

        resource.fulfilled_by = volunteer.user_id;
        await resource.save();
      }
    }
  }

  await event.save();

  // Check readiness
  const resources = await db.EventResource.find({ event_id: event._id });
  const landResource = resources.find((r) => r.resource_type === 'Land');
  const saplingsResource = resources.find((r) => r.resource_type === 'Saplings');

  const isReady =
    landResource?.status === 'Complete' &&
    saplingsResource?.status === 'Complete' &&
    parseFloat(event.funding_fulfilled) >= parseFloat(event.funding_goal) * 0.5;

  if (isReady && !event.is_ready_to_start) {
    event.is_ready_to_start = true;
    event.current_phase = 'DIGGING';
    await event.save();
  }
};

// Send Join Request
export const sendJoinRequest = async (eventId, userId, joinData) => {
  const event = await db.Event.findById(eventId);

  if (!event) {
    throw { status: 404, message: 'Event not found' };
  }

  // Cannot join own event
  if (event.creator_id.toString() === userId) {
    throw { status: 400, message: 'Cannot join your own event' };
  }

  const effectiveJoinDeadline = await syncEffectiveJoinDeadline(event);

  // Check join deadline
  if (effectiveJoinDeadline && effectiveJoinDeadline < new Date()) {
    throw { status: 400, message: 'Join deadline has passed for this event' };
  }

  // Check if already requested
  const existing = await db.EventVolunteer.findOne({
    event_id: eventId,
    user_id: userId,
  });

  if (existing) {
    if (existing.request_status === 'PENDING') {
      throw { status: 400, message: 'Request already pending' };
    }
    if (existing.request_status === 'ACCEPTED') {
      throw { status: 400, message: 'Already joined this event' };
    }
    if (existing.request_status === 'REJECTED') {
      throw { status: 400, message: 'Your previous request was rejected' };
    }
  }

  const {
    contribution_type,
    tree_ids,
    hard_tasks,
    soft_tasks,
    resource_type,
    procurement_type,
    contribution_amount,
    contribution_quantity,
    volunteer_hours,
    social_media_link,
  } = joinData;

  const normalizedHardTasks = Array.isArray(hard_tasks)
    ? Array.from(new Set(hard_tasks.map((item) => String(item || '').trim()).filter(Boolean)))
    : [];
  const normalizedSoftTasks = Array.isArray(soft_tasks)
    ? Array.from(new Set(soft_tasks.map((item) => String(item || '').trim()).filter(Boolean)))
    : [];
  const normalizedTreeIds = Array.isArray(tree_ids)
    ? Array.from(new Set(tree_ids.map((item) => String(item || '').trim()).filter(Boolean)))
    : [];
  const normalizedVolunteerHours = Number(volunteer_hours || 0);
  const normalizedContributionAmount = Number(contribution_amount || 0);
  const normalizedContributionQuantity = Number(contribution_quantity || 0);

  if (!['Labor', 'Capital'].includes(contribution_type)) {
    throw { status: 400, message: 'Contribution type must be Labor or Capital' };
  }

  if (contribution_type === 'Labor') {
    const hasInvalidHardTask = normalizedHardTasks.some((task) => !VALID_HARD_TASKS.includes(task));
    const hasInvalidSoftTask = normalizedSoftTasks.some((task) => !VALID_SOFT_TASKS.includes(task));

    if (hasInvalidHardTask || hasInvalidSoftTask) {
      throw { status: 400, message: 'One or more selected tasks are invalid' };
    }

    if (normalizedHardTasks.length === 0 && normalizedSoftTasks.length === 0) {
      throw { status: 400, message: 'Select at least one volunteer task' };
    }

    if (!Number.isFinite(normalizedVolunteerHours) || normalizedVolunteerHours <= 0) {
      throw { status: 400, message: 'Volunteer hours must be greater than zero' };
    }
  }

  if (contribution_type === 'Capital') {
    if (!VALID_RESOURCE_TYPES.includes(resource_type || '')) {
      throw { status: 400, message: 'Selected resource type is invalid' };
    }

    if (!VALID_PROCUREMENT_TYPES.includes(procurement_type || '')) {
      throw { status: 400, message: 'Procurement type must be Fund or Procure' };
    }

    if (procurement_type === 'Fund' && (!Number.isFinite(normalizedContributionAmount) || normalizedContributionAmount <= 0)) {
      throw { status: 400, message: 'Contribution amount must be greater than zero' };
    }

    if (
      procurement_type === 'Procure' &&
      (!Number.isFinite(normalizedContributionQuantity) || !Number.isInteger(normalizedContributionQuantity) || normalizedContributionQuantity <= 0)
    ) {
      throw { status: 400, message: 'Contribution quantity must be a positive whole number' };
    }
  }

  if (normalizedTreeIds.length > 0) {
    const matchedTreeCount = await db.Tree.countDocuments({
      _id: { $in: normalizedTreeIds },
      event_id: eventId,
    });

    if (matchedTreeCount !== normalizedTreeIds.length) {
      throw { status: 400, message: 'Selected trees must belong to this event' };
    }
  }

  // Calculate karma
  let karmaEarned = 0;
  if (contribution_type === 'Labor') {
    karmaEarned += normalizedHardTasks.length * 15;
    karmaEarned += normalizedSoftTasks.length * 10;
  } else if (contribution_type === 'Capital') {
    karmaEarned += Math.floor(normalizedContributionAmount / 100) * 5;
    if (procurement_type === 'Procure') karmaEarned += 20;
  }
  if (social_media_link) karmaEarned += 10;

  const initialStatus = event.approval_mode === 'Auto' ? 'ACCEPTED' : 'PENDING';

  const volunteer = await db.EventVolunteer.create({
    event_id: eventId,
    user_id: userId,
    contribution_type,
    role: contribution_type === 'Capital' ? 'Sponsor' : 'Volunteer',
    tree_ids: normalizedTreeIds,
    hard_tasks: normalizedHardTasks,
    soft_tasks: normalizedSoftTasks,
    resource_type: resource_type || null,
    procurement_type: procurement_type || null,
    contribution_amount: normalizedContributionAmount,
    contribution_quantity: normalizedContributionQuantity,
    volunteer_hours: contribution_type === 'Labor' ? normalizedVolunteerHours : 0,
    shared_on_social: !!social_media_link,
    social_media_link: social_media_link || null,
    karma_earned: karmaEarned,
    request_status: initialStatus,
    requested_at: new Date(),
    responded_at: initialStatus === 'ACCEPTED' ? new Date() : null,
    receipt_id:
      contribution_type === 'Capital' && Number(contribution_amount || 0) > 0
        ? generatePublicId('RECEIPT')
        : null,
    receipt_generated_at:
      contribution_type === 'Capital' && Number(contribution_amount || 0) > 0
        ? new Date()
        : null,
  });

  // If Auto-Accept, apply contribution
  if (initialStatus === 'ACCEPTED') {
    await applyContributionInternal(event, volunteer);

    const user = await db.User.findById(userId);
    if (user) {
      user.karma_points = (user.karma_points || 0) + karmaEarned;
      await user.save();
    }
  }

  return {
    volunteer,
    karmaEarned,
    status: initialStatus,
    message:
      initialStatus === 'ACCEPTED'
        ? 'Auto-accepted! You have joined the event.'
        : 'Request sent! Waiting for organizer approval.',
  };
};

// Accept Request
export const acceptRequest = async (requestId, creatorId) => {
  const volunteer = await db.EventVolunteer.findById(requestId);

  if (!volunteer) {
    throw { status: 404, message: 'Request not found' };
  }

  const event = await db.Event.findById(volunteer.event_id);

  if (event.creator_id.toString() !== creatorId) {
    throw { status: 403, message: 'Only event creator can accept requests' };
  }

  if (volunteer.request_status !== 'PENDING') {
    throw { status: 400, message: 'Request already processed' };
  }

  volunteer.request_status = 'ACCEPTED';
  volunteer.responded_at = new Date();
  await volunteer.save();

  // Apply contribution
  await applyContributionInternal(event, volunteer);

  // Award karma
  const user = await db.User.findById(volunteer.user_id);
  if (user) {
    user.karma_points = (user.karma_points || 0) + volunteer.karma_earned;
    await user.save();
  }

  // Link trees if specified
  const treeIds = volunteer.tree_ids || [];
  if (treeIds.length > 0 && volunteer.contribution_type === 'Capital') {
    for (const treeId of treeIds) {
      const tree = await db.Tree.findById(treeId);
      if (tree) {
        tree.sponsor_id = volunteer.user_id;
        await tree.save();
        await logPlantTracking(
          tree,
          volunteer.user_id,
          'SPONSORED',
          'Tree sponsorship confirmed',
          'This tree now has a sponsor assigned from the accepted event request.',
          {
            sponsor_request_id: volunteer._id,
          }
        );
      }
    }
  }

  return volunteer;
};

// Reject Request
export const rejectRequest = async (requestId, creatorId, reason = null) => {
  const volunteer = await db.EventVolunteer.findById(requestId);

  if (!volunteer) {
    throw { status: 404, message: 'Request not found' };
  }

  const event = await db.Event.findById(volunteer.event_id);

  if (event.creator_id.toString() !== creatorId) {
    throw { status: 403, message: 'Only event creator can reject requests' };
  }

  if (volunteer.request_status !== 'PENDING') {
    throw { status: 400, message: 'Request already processed' };
  }

  volunteer.request_status = 'REJECTED';
  volunteer.rejection_reason = reason || 'Not required at this time';
  volunteer.responded_at = new Date();
  await volunteer.save();

  return volunteer;
};

// Update Event
export const updateEvent = async (eventId, creatorId, updateData) => {
  const event = await db.Event.findById(eventId);

  if (!event) {
    throw { status: 404, message: 'Event not found' };
  }

  if (event.creator_id.toString() !== creatorId) {
    throw { status: 403, message: 'Only event creator can update' };
  }

  const treeCount = Number(updateData.tree_count);
  const budget = Number(updateData.budget);
  const expectedVolunteers = Number(updateData.expected_volunteers);
  const pinCode = String(updateData.pin_code || '').trim();
  const eventIdValue = String(updateData.event_id || '').trim();
  const location = String(updateData.location || '').trim();
  const locationCode = String(updateData.location_code || '').trim();
  const description = String(updateData.description || '').trim();
  const treeSpecies = String(updateData.tree_species || '').trim();
  const maintenancePlan = String(updateData.maintenance_plan || '').trim();
  const communityStrategy = String(updateData.community_engagement_strategy || '').trim();
  const creatorName = String(updateData.contact_person?.name || '').trim();
  const organizationName = String(updateData.contact_person?.organization || '').trim();
  const contactPhone = String(updateData.contact_person?.phone || '').trim();
  const contactEmail = String(updateData.contact_person?.email || '').trim();
  const climateZone = String(updateData.climate_zone || '').trim();
  const eventDate = updateData.date_time ? new Date(updateData.date_time) : null;
  const joinDeadline = updateData.join_deadline ? new Date(updateData.join_deadline) : null;
  const socialMediaHandles = Array.isArray(updateData.social_media_handles)
    ? Array.from(new Set(updateData.social_media_handles.map((item) => String(item || '').trim()).filter(Boolean)))
    : [];

  if (
    isBlank(eventIdValue) ||
    isBlank(location) ||
    !/^\d{6}$/.test(pinCode) ||
    !new RegExp(`^${pinCode}-\\d{16}$`).test(eventIdValue) ||
    locationCode !== pinCode ||
    !eventDate ||
    Number.isNaN(eventDate.getTime()) ||
    !Number.isInteger(treeCount) ||
    treeCount <= 0 ||
    !Number.isFinite(budget) ||
    budget < 0 ||
    !Number.isInteger(expectedVolunteers) ||
    expectedVolunteers < 0 ||
    isBlank(treeSpecies) ||
    isBlank(description) ||
    isBlank(maintenancePlan) ||
    isBlank(creatorName) ||
    isBlank(organizationName) ||
    !EMAIL_REGEX.test(contactEmail) ||
    !PHONE_REGEX.test(contactPhone) ||
    isBlank(climateZone)
  ) {
    throw { status: 400, message: 'Please provide valid event details for update' };
  }

  if (eventDate <= new Date()) {
    throw { status: 400, message: 'Event date must be a future date and time' };
  }

  if (joinDeadline && (Number.isNaN(joinDeadline.getTime()) || joinDeadline >= eventDate)) {
    throw { status: 400, message: 'Join deadline must be earlier than the event date' };
  }

  if (updateData.land_allocation_status === 'ALLOCATED' && !updateData.land_id) {
    throw { status: 400, message: 'Allocated events must include a selected land' };
  }

  if (updateData.land_allocation_status === 'NEEDED' && updateData.land_id) {
    throw { status: 400, message: 'Land should not be pre-selected when allocation is still needed' };
  }

  const selectedLand = updateData.land_id ? await db.Land.findById(updateData.land_id).lean() : null;
  if (updateData.land_id && !selectedLand) {
    throw { status: 400, message: 'Selected land does not exist' };
  }

  if (selectedLand && String(selectedLand.owner_id) !== String(creatorId)) {
    throw { status: 403, message: 'You can only use your own land entries for this event' };
  }

  const proposedLand = updateData.proposed_land || null;
  if (proposedLand?.latitude !== null && proposedLand?.latitude !== undefined) {
    const latitude = Number(proposedLand.latitude);
    if (!ensureValidCoordinate(latitude, -90, 90)) {
      throw { status: 400, message: 'Proposed land latitude is invalid' };
    }
  }

  if (proposedLand?.longitude !== null && proposedLand?.longitude !== undefined) {
    const longitude = Number(proposedLand.longitude);
    if (!ensureValidCoordinate(longitude, -180, 180)) {
      throw { status: 400, message: 'Proposed land longitude is invalid' };
    }
  }

  if (proposedLand?.area_sqft !== null && proposedLand?.area_sqft !== undefined) {
    const area = Number(proposedLand.area_sqft);
    if (!Number.isFinite(area) || area <= 0) {
      throw { status: 400, message: 'Proposed land area must be a positive number' };
    }
  }

  const previousLandId = event.land_id ? String(event.land_id) : null;
  const nextLandId = updateData.land_id ? String(updateData.land_id) : null;
  if (previousLandId && nextLandId && previousLandId !== nextLandId) {
    const nonPlannedTreeCount = await db.Tree.countDocuments({
      event_id: event._id,
      status: { $ne: 'Planned' },
    });

    if (nonPlannedTreeCount > 0) {
      throw {
        status: 400,
        message: 'Land cannot be changed after tree work has started for this event',
      };
    }
  }

  const treeSuggestions = suggestTreeTypes({
    tree_species: treeSpecies,
    climate_zone: climateZone,
    soil_type: selectedLand?.soil_type,
    water_availability: selectedLand?.water_availability,
  });

  event.event_id = eventIdValue;
  event.pin_code = pinCode;
  event.location_code = pinCode;
  event.location = location;
  event.description = description;
  event.date_time = eventDate;
  event.join_deadline = joinDeadline || new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
  event.tree_count = treeCount;
  event.tree_species = treeSpecies;
  event.budget = budget;
  event.role = updateData.role;
  event.land_id = updateData.land_id || null;
  event.initiation_type = updateData.initiation_type;
  event.approval_mode = updateData.approval_mode;
  event.land_allocation_status = updateData.land_allocation_status;
  event.proposed_land = proposedLand;
  event.land_support_options = updateData.land_support_options || [];
  event.land_support_other = updateData.land_support_other || null;
  event.can_run_without_sponsorship = !!updateData.can_run_without_sponsorship;
  event.expected_volunteers = expectedVolunteers;
  event.maintenance_plan = maintenancePlan;
  event.community_engagement_strategy = communityStrategy || null;
  event.media_coverage = !!updateData.media_coverage;
  event.social_media_handles = socialMediaHandles;
  event.contact_person = {
    name: creatorName,
    organization: organizationName,
    phone: contactPhone,
    email: contactEmail,
  };
  event.climate_zone = climateZone;
  event.suggested_tree_types = treeSuggestions;
  event.labor_goal = Number(updateData.labor_goal || expectedVolunteers);
  event.funding_goal = Number(updateData.funding_goal || budget);
  event.procurement_status = updateData.procurement_status || event.procurement_status;
  event.markModified('contact_person');
  event.markModified('proposed_land');
  event.markModified('social_media_handles');
  event.markModified('land_support_options');
  event.markModified('suggested_tree_types');

  const session = await db.mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await event.save({ session });
      await syncEventTreeRecords(event, creatorId, session);
      await upsertEventResources(event, treeCount, session);
    });
  } finally {
    await session.endSession();
  }

  if (previousLandId && previousLandId !== nextLandId) {
    await syncLandDerivedState(previousLandId);
  }

  if (nextLandId) {
    if (previousLandId !== nextLandId) {
      await db.LandActivity.create({
        land_id: nextLandId,
        user_id: creatorId,
        activity_type: 'EventUpdated',
        description: `Event ${event.event_id} updated on this land`,
        metadata: {
          event_id: event._id,
          tree_count: event.tree_count,
        },
      });
    }

    await syncLandDerivedState(nextLandId);
  }

  return event;
};

// Delete Event
export const deleteEvent = async (eventId, creatorId) => {
  const event = await db.Event.findById(eventId);

  if (!event) {
    throw { status: 404, message: 'Event not found' };
  }

  if (event.creator_id.toString() !== creatorId) {
    throw { status: 403, message: 'Only event creator can delete' };
  }

  // Soft delete
  event.is_active = false;
  await event.save();

  const eventTrees = await db.Tree.find({ event_id: eventId }).select('_id');
  const treeIds = eventTrees.map((tree) => tree._id);

  if (treeIds.length > 0) {
    await Promise.all([
      db.TreeTask.deleteMany({ tree_id: { $in: treeIds } }),
      db.PlantTracking.deleteMany({ tree_id: { $in: treeIds } }),
      db.EventVolunteer.updateMany(
        { event_id: eventId },
        { $pull: { tree_ids: { $in: treeIds } } }
      ),
      db.Tree.deleteMany({ _id: { $in: treeIds } }),
    ]);
  }

  // Cancel all pending requests
  await db.EventVolunteer.updateMany(
    { event_id: eventId, request_status: 'PENDING' },
    { request_status: 'REJECTED', rejection_reason: 'Event cancelled' }
  );

  await db.EventResource.deleteMany({ event_id: eventId });

  if (event.land_id) {
    await syncLandDerivedState(event.land_id);
  }

  return { message: 'Event deleted successfully' };
};

// Get user's request status
export const getUserRequestStatus = async (eventId, userId) => {
  const request = await db.EventVolunteer.findOne({
    event_id: eventId,
    user_id: userId,
  });

  return request;
};

// Advance event phase
export const advanceEventPhase = async (eventId, creatorId) => {
  const event = await db.Event.findById(eventId);

  if (!event) {
    throw { status: 404, message: 'Event not found' };
  }

  if (event.creator_id.toString() !== creatorId) {
    throw { status: 403, message: 'Only event creator can advance phase' };
  }

  if (!event.is_ready_to_start) {
    throw { status: 400, message: 'Event not ready to start. Resources incomplete.' };
  }

  const phases = [
    'WAITING_RESOURCES',
    'DIGGING',
    'PLANTING',
    'WATERING',
    'FERTILIZING',
    'GUARDING',
    'MAINTENANCE',
    'COMPLETED',
  ];

  const currentIndex = phases.indexOf(event.current_phase);
  if (currentIndex < phases.length - 1) {
    event.current_phase = phases[currentIndex + 1];
    await event.save();
  }

  return event;
};

// Get Resources
export const getEventResources = async (eventId) => {
  const resources = await db.EventResource.find({ event_id: eventId })
    .populate('fulfilled_by', 'name')
    .lean();

  return resources.map((r) => ({
    ...r,
    fulfiller: r.fulfilled_by,
  }));
};
