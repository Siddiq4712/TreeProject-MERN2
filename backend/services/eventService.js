import db from '../models/index.js';
import mongoose from 'mongoose';

// Create Event
export const createEvent = async (eventData, creatorId) => {
  const treeCount = eventData.tree_count;

  const calculatedFundingGoal =
    treeCount * 20 + // Saplings
    treeCount * 5 + // Fertilizer
    treeCount * 10 + // Guards
    (eventData.land_id ? 0 : 5000); // Land

  // Set default join deadline to 3 days before event
  let joinDeadline = eventData.join_deadline;
  if (!joinDeadline && eventData.date_time) {
    const eventDate = new Date(eventData.date_time);
    joinDeadline = new Date(eventDate.getTime() - 3 * 24 * 60 * 60 * 1000);
  }

  const newEvent = await db.Event.create({
    event_id: eventData.event_id,
    location: eventData.location,
    description: eventData.description || null,
    date_time: eventData.date_time || new Date(),
    join_deadline: joinDeadline,
    tree_count: treeCount,
    tree_species: eventData.tree_species || 'Mixed',
    budget: eventData.budget || 0,
    role: eventData.role,
    creator_id: creatorId,
    land_id: eventData.land_id || null,
    initiation_type: eventData.initiation_type || 'Volunteer-Led',
    approval_mode: eventData.approval_mode || 'Manual',
    funding_goal: eventData.funding_goal || calculatedFundingGoal,
    funding_fulfilled: 0,
    labor_goal: eventData.labor_goal || Math.ceil(treeCount / 5),
    labor_fulfilled: 0,
    current_phase: 'WAITING_RESOURCES',
    is_ready_to_start: false,
    is_active: true,
    banner_url: eventData.banner_url || null,
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

  return newEvent;
};

// Get All Events (EXCLUDE creator's own events)
export const getAllEvents = async (userId) => {
  const events = await db.Event.find({
    creator_id: { $ne: userId },
    is_active: true,
  })
    .populate('creator_id', 'name role')
    .populate('land_id', 'name address')
    .sort({ created_at: -1 })
    .lean();

  // Fetch related data for each event
  for (let event of events) {
    event.creator = event.creator_id;
    event.land = event.land_id;

    event.resources = await db.EventResource.find({ event_id: event._id }).lean();
    event.trees = await db.Tree.find({ event_id: event._id }).select('tree_id species status').lean();
    event.eventVolunteers = await db.EventVolunteer.find({
      event_id: event._id,
      request_status: 'ACCEPTED',
    })
      .populate('user_id', 'name role')
      .lean();

    event.eventVolunteers = event.eventVolunteers.map((v) => ({
      ...v,
      user: v.user_id,
    }));
  }

  return events;
};

// Get My Created Events
export const getMyCreatedEvents = async (userId) => {
  const events = await db.Event.find({ creator_id: userId })
    .populate('land_id', 'name address')
    .sort({ created_at: -1 })
    .lean();

  for (let event of events) {
    event.land = event.land_id;
    event.resources = await db.EventResource.find({ event_id: event._id }).lean();
    event.trees = await db.Tree.find({ event_id: event._id }).select('tree_id species status').lean();
    event.eventVolunteers = await db.EventVolunteer.find({ event_id: event._id })
      .populate('user_id', 'name role email')
      .lean();

    event.eventVolunteers = event.eventVolunteers.map((v) => ({
      ...v,
      user: v.user_id,
    }));

    const volunteers = event.eventVolunteers || [];
    event.pending_requests = volunteers.filter((v) => v.request_status === 'PENDING').length;
    event.accepted_requests = volunteers.filter((v) => v.request_status === 'ACCEPTED').length;
    event.rejected_requests = volunteers.filter((v) => v.request_status === 'REJECTED').length;
  }

  return events;
};

// Get Event By ID
export const getEventById = async (eventId) => {
  const event = await db.Event.findById(eventId)
    .populate('creator_id', 'name role')
    .populate('land_id')
    .lean();

  if (!event) return null;

  event.creator = event.creator_id;
  event.land = event.land_id;
  event.resources = await db.EventResource.find({ event_id: event._id }).lean();
  event.trees = await db.Tree.find({ event_id: event._id }).lean();
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
    .populate('creator_id', 'name role email')
    .populate('land_id')
    .lean();

  if (!event) {
    throw { status: 404, message: 'Event not found' };
  }

  event.creator = event.creator_id;
  event.land = event.land_id;
  event.resources = await db.EventResource.find({ event_id: event._id }).lean();
  event.trees = await db.Tree.find({ event_id: event._id }).lean();
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

  // Check join deadline
  if (event.join_deadline && new Date(event.join_deadline) < new Date()) {
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
    social_media_link,
  } = joinData;

  // Calculate karma
  let karmaEarned = 0;
  if (contribution_type === 'Labor') {
    karmaEarned += (hard_tasks?.length || 0) * 15;
    karmaEarned += (soft_tasks?.length || 0) * 10;
  } else if (contribution_type === 'Capital') {
    karmaEarned += Math.floor((contribution_amount || 0) / 100) * 5;
    if (procurement_type === 'Procure') karmaEarned += 20;
  }
  if (social_media_link) karmaEarned += 10;

  const initialStatus = event.approval_mode === 'Auto' ? 'ACCEPTED' : 'PENDING';

  const volunteer = await db.EventVolunteer.create({
    event_id: eventId,
    user_id: userId,
    contribution_type,
    role: contribution_type === 'Capital' ? 'Sponsor' : 'Volunteer',
    tree_ids: tree_ids || [],
    hard_tasks: hard_tasks || [],
    soft_tasks: soft_tasks || [],
    resource_type: resource_type || null,
    procurement_type: procurement_type || null,
    contribution_amount: contribution_amount || 0,
    contribution_quantity: contribution_quantity || 0,
    shared_on_social: !!social_media_link,
    social_media_link: social_media_link || null,
    karma_earned: karmaEarned,
    request_status: initialStatus,
    requested_at: new Date(),
    responded_at: initialStatus === 'ACCEPTED' ? new Date() : null,
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

  const allowedFields = ['location', 'date_time', 'tree_species', 'approval_mode', 'labor_goal'];
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      event[field] = updateData[field];
    }
  }

  await event.save();

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

  // Cancel all pending requests
  await db.EventVolunteer.updateMany(
    { event_id: eventId, request_status: 'PENDING' },
    { request_status: 'REJECTED', rejection_reason: 'Event cancelled' }
  );

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