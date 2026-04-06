import * as eventService from '../services/eventService.js';

export const create = async (req, res) => {
  const {
    event_id,
    location,
    date_time,
    tree_count,
    tree_species,
    budget,
    role,
    land_id,
    initiation_type,
    approval_mode,
    funding_goal,
    labor_goal,
  } = req.body;

  try {
    const newEvent = await eventService.createEvent(
      {
        event_id,
        location,
        date_time,
        tree_count,
        tree_species,
        budget,
        role,
        land_id,
        initiation_type,
        approval_mode,
        funding_goal,
        labor_goal,
      },
      req.user.id
    );

    res.status(201).json({
      message: 'Event created',
      event_id: newEvent.event_id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all events (excluding user's own)
export const getAll = async (req, res) => {
  try {
    const events = await eventService.getAllEvents(req.user.id);
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get my created events
export const getMyCreated = async (req, res) => {
  try {
    const events = await eventService.getMyCreatedEvents(req.user.id);
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getById = async (req, res) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get event requests (for creator)
export const getRequests = async (req, res) => {
  try {
    const status = req.query.status || null;
    const requests = await eventService.getEventRequests(req.params.id, req.user.id, status);
    res.json(requests);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

// Send join request
export const join = async (req, res) => {
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
  } = req.body;

  if (!contribution_type) {
    return res.status(400).json({ message: 'Contribution type (Labor/Capital) is required' });
  }

  try {
    const result = await eventService.sendJoinRequest(req.params.id, req.user.id, {
      contribution_type,
      tree_ids,
      hard_tasks,
      soft_tasks,
      resource_type,
      procurement_type,
      contribution_amount,
      contribution_quantity,
      social_media_link,
    });

    res.status(201).json({
      message: result.message,
      request_status: result.status,
      karma_earned: result.karmaEarned,
      volunteer: result.volunteer,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

// Accept request
export const acceptRequest = async (req, res) => {
  try {
    const volunteer = await eventService.acceptRequest(req.params.requestId, req.user.id);
    res.json({
      message: 'Request accepted',
      volunteer,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

// Reject request
export const rejectRequest = async (req, res) => {
  const { reason } = req.body;

  try {
    const volunteer = await eventService.rejectRequest(req.params.requestId, req.user.id, reason);
    res.json({
      message: 'Request rejected',
      volunteer,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

// Update event
export const update = async (req, res) => {
  try {
    const event = await eventService.updateEvent(req.params.id, req.user.id, req.body);
    res.json({
      message: 'Event updated',
      event,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

// Delete event
export const remove = async (req, res) => {
  try {
    const result = await eventService.deleteEvent(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

// Advance phase
export const advancePhase = async (req, res) => {
  try {
    const event = await eventService.advanceEventPhase(req.params.id, req.user.id);
    res.json({
      message: `Event advanced to ${event.current_phase}`,
      event,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

// Get resources
export const getResources = async (req, res) => {
  try {
    const resources = await eventService.getEventResources(req.params.id);
    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's request status
export const getMyRequestStatus = async (req, res) => {
  try {
    const request = await eventService.getUserRequestStatus(req.params.id, req.user.id);
    res.json({ request });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Event Detail with Role Context
export const getDetail = async (req, res) => {
  try {
    const eventDetail = await eventService.getEventDetail(req.params.id, req.user.id);
    res.json(eventDetail);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};