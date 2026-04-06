import db from '../models/index.js';

const sumBy = (items, selector) => items.reduce((sum, item) => sum + selector(item), 0);

export const getAdminDashboard = async () => {
  const [users, events, lands, trees, contributions, tasks] = await Promise.all([
    db.User.find().lean(),
    db.Event.find().lean(),
    db.Land.find().lean(),
    db.Tree.find().lean(),
    db.EventVolunteer.find().lean(),
    db.TreeTask.find().lean(),
  ]);

  const totalDonations = sumBy(
    contributions.filter((entry) => entry.contribution_type === 'Capital' && entry.request_status === 'ACCEPTED'),
    (entry) => Number(entry.contribution_amount || 0)
  );

  const volunteerHours = sumBy(contributions, (entry) => Number(entry.volunteer_hours || 0));

  return {
    stats: {
      users: users.length,
      volunteers: users.filter((user) => user.role === 'Volunteer').length,
      sponsors: users.filter((user) => user.role === 'Sponsor').length,
      landowners: users.filter((user) => user.role === 'Landowner').length,
      organizations: users.filter((user) => user.account_type === 'Organization').length,
      events: events.length,
      active_events: events.filter((event) => event.current_phase !== 'COMPLETED' && event.is_active !== false).length,
      lands: lands.length,
      trees: trees.length,
      healthy_trees: trees.filter((tree) => tree.survival_status === 'Healthy').length,
      total_donations: totalDonations,
      volunteer_hours: volunteerHours,
      completed_tasks: tasks.length,
    },
    recentUsers: users
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8),
    recentEvents: events
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8),
  };
};

export const getUsers = async (filters = {}) => {
  const query = {};
  if (filters.role) query.role = filters.role;
  if (filters.account_type) query.account_type = filters.account_type;

  const users = await db.User.find(query)
    .select('name email role account_type organization_name phone sponsor_logo_url bio is_active karma_points created_at')
    .sort({ created_at: -1 })
    .lean();

  return users;
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

export const getReports = async () => {
  const [events, trees, volunteers, lands, users] = await Promise.all([
    db.Event.find().lean(),
    db.Tree.find().populate('sponsor_id', 'name organization_name').populate('planted_by', 'name').lean(),
    db.EventVolunteer.find().populate('user_id', 'name').populate('event_id', 'event_id location').lean(),
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
  };
};
