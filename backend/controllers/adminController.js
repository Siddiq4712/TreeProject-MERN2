import * as adminService from '../services/adminService.js';
import { parsePagination } from '../utils/pagination.js';

export const dashboard = async (req, res) => {
  try {
    const data = await adminService.getAdminDashboard();
    res.json(data);
  } catch (error) {
    console.error('adminController.dashboard failed:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

export const users = async (req, res) => {
  try {
    const data = await adminService.getUsers(req.query, parsePagination(req.query));
    res.json(data);
  } catch (error) {
    console.error('adminController.users failed:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await adminService.updateUser(req.params.id, req.body);
    res.json({ message: 'User updated', user });
  } catch (error) {
    console.error('adminController.updateUser failed:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

export const reports = async (req, res) => {
  try {
    const data = await adminService.getReports();
    res.json(data);
  } catch (error) {
    console.error('adminController.reports failed:', error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};
