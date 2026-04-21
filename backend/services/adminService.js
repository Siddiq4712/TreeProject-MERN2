import db from '../models/index.js';
import { createPaginatedResponse } from '../utils/pagination.js';

const sumBy = (items, selector) => items.reduce((sum, item) => sum + selector(item), 0);

export const getAdminDashboard = async () => {
  const [usersCount, volunteerCount, sponsorCount, landownerCount, organizationCount, eventsCount, activeEventsCount, landsCount, treesCount, healthyTreesCount, donationsAgg, volunteerHoursAgg, tasksCount, recentUsers, recentEvents] = await Promise.all([
    db.User.countDocuments(),
    db.User.countDocuments({ role: 'Volunteer' }),
    db.User.countDocuments({ role: 'Sponsor' }),
    db.User.countDocuments({ role: 'Landowner' }),
    db.User.countDocuments({ account_type: 'Organization' }),
    db.Event.countDocuments(),
    db.Event.countDocuments({ current_phase: { $ne: 'COMPLETED' }, is_active: { $ne: false } }),
    db.Land.countDocuments(),
    db.Tree.countDocuments(),
    db.Tree.countDocuments({ survival_status: 'Healthy' }),
    db.EventVolunteer.aggregate([
      { $match: { contribution_type: 'Capital', request_status: 'ACCEPTED' } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$contribution_amount', 0] } } } },
    ]),
    db.EventVolunteer.aggregate([
      { $group: { _id: null, total: { $sum: { $ifNull: ['$volunteer_hours', 0] } } } },
    ]),
    db.TreeTask.countDocuments(),
    db.User.find().sort({ created_at: -1 }).limit(8).lean(),
    db.Event.find().sort({ created_at: -1 }).limit(8).lean(),
  ]);

  return {
    stats: {
      users: usersCount,
      volunteers: volunteerCount,
      sponsors: sponsorCount,
      landowners: landownerCount,
      organizations: organizationCount,
      events: eventsCount,
      active_events: activeEventsCount,
      lands: landsCount,
      trees: treesCount,
      healthy_trees: healthyTreesCount,
      total_donations: Number(donationsAgg[0]?.total || 0),
      volunteer_hours: Number(volunteerHoursAgg[0]?.total || 0),
      completed_tasks: tasksCount,
    },
    recentUsers,
    recentEvents,
  };
};

export const getUsers = async (filters = {}, pagination) => {
  const query = {};
  if (filters.role) query.role = filters.role;
  if (filters.account_type) query.account_type = filters.account_type;

  const [users, total] = await Promise.all([
    db.User.find(query)
      .select('name email role account_type organization_name phone sponsor_logo_url bio is_active karma_points created_at')
      .sort({ created_at: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    db.User.countDocuments(query),
  ]);

  return createPaginatedResponse({
    items: users,
    page: pagination.page,
    limit: pagination.limit,
    total,
  });
};

export const updateUser = async (userId, payload) => {
  const user = await db.User.findById(userId);
  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  const fields = ['role', 'account_type', 'organization_name', 'phone', 'sponsor_logo_url', 'bio', 'is_active'];
  fields.forEach((field) => {
    if (payload[field] !== undefined) {
      user[field] = payload[field];
    }
  });

  await user.save();
  return user;
};

export const getReports = async (limits = {}) => {
  const reportLimit = Math.min(Math.max(Number(limits.limit || 20), 1), 50);
  const [events, trees, volunteers, lands, users] = await Promise.all([
    db.Event.find().sort({ created_at: -1 }).limit(reportLimit).lean(),
    db.Tree.find().sort({ created_at: -1 }).limit(reportLimit).populate('sponsor_id', 'name organization_name').populate('planted_by', 'name').lean(),
    db.EventVolunteer.find().sort({ requested_at: -1 }).limit(reportLimit).populate('user_id', 'name').populate('event_id', 'event_id location').lean(),
    db.Land.find().lean(),
    db.User.find().lean(),
  ]);

  return {
    eventProgress: events.map((event) => ({
      event_id: event.event_id,
      location: event.location,
      tree_count: event.tree_count,
      funding_goal: event.funding_goal,
      funding_fulfilled: event.funding_fulfilled,
      labor_goal: event.labor_goal,
      labor_fulfilled: event.labor_fulfilled,
      phase: event.current_phase,
    })),
    donationImpact: volunteers
      .filter((entry) => entry.contribution_type === 'Capital' && entry.request_status === 'ACCEPTED')
      .map((entry) => ({
        sponsor_name: entry.user_id?.name || 'Unknown',
        event_id: entry.event_id?.event_id || 'Unknown',
        event_location: entry.event_id?.location || 'Unknown',
        contribution_amount: entry.contribution_amount,
        receipt_id: entry.receipt_id || null,
        volunteer_hours: entry.volunteer_hours || 0,
        tree_ids: entry.tree_ids || [],
      })),
    treeImpact: trees.map((tree) => ({
      tree_id: tree.tree_id,
      species: tree.species,
      status: tree.status,
      growth_status: tree.growth_status,
      survival_status: tree.survival_status,
      sponsor_name: tree.sponsor_id?.organization_name || tree.sponsor_id?.name || null,
      planted_by: tree.planted_by?.name || null,
      latitude: tree.latitude || null,
      longitude: tree.longitude || null,
      maintenance_due_at: tree.maintenance_due_at || null,
    })),
    totals: {
      lands: lands.length,
      users: users.length,
      organizations: users.filter((user) => user.account_type === 'Organization').length,
      donors: users.filter((user) => user.role === 'Sponsor').length,
    },
    pagination: {
      report_limit: reportLimit,
    },
  };
};
