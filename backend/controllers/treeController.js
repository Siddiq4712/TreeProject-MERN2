import * as treeService from '../services/treeService.js';

export const create = async (req, res) => {
  const { species, event_id, land_id, sponsor_id } = req.body;

  if (!species) {
    return res.status(400).json({ message: 'Species is required' });
  }

  try {
    const newTree = await treeService.createTree(
      { species, event_id, land_id, sponsor_id },
      req.user.id
    );

    res.status(201).json({
      message: 'Tree created',
      tree: newTree,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// NEW: Add Historical Tree
export const createHistorical = async (req, res) => {
  const { species, land_id, planted_date, growth_status, survival_status, height_cm, photo_url, notes, has_tree_guard } = req.body;

  if (!species) {
    return res.status(400).json({ message: 'Species is required' });
  }

  try {
    const newTree = await treeService.createHistoricalTree(
      { species, land_id, planted_date, growth_status, survival_status, height_cm, photo_url, notes, has_tree_guard },
      req.user.id
    );

    res.status(201).json({
      message: 'Historical tree added successfully',
      tree: newTree,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const trees = await treeService.getAllTrees();
    res.json(trees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMine = async (req, res) => {
  try {
    const filter = req.query.filter;
    let trees;

    if (filter) {
      trees = await treeService.getTreesByFilter(req.user.id, filter);
    } else {
      trees = await treeService.getMyTrees(req.user.id);
    }

    res.json(trees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getById = async (req, res) => {
  try {
    const tree = await treeService.getTreeById(req.params.id);
    res.json(tree);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

export const addTask = async (req, res) => {
  const { task_type, notes } = req.body;
  const treeId = req.params.id;

  if (!task_type) {
    return res.status(400).json({ message: 'Task type is required' });
  }

  try {
    const task = await treeService.addTreeTask(treeId, task_type, req.user.id, notes);
    res.status(201).json({
      message: 'Task completed successfully',
      task,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

export const updateHealth = async (req, res) => {
  const { growth_status, survival_status, height_cm } = req.body;
  const treeId = req.params.id;

  try {
    const tree = await treeService.updateTreeHealth(treeId, {
      growth_status,
      survival_status,
      height_cm,
    }, req.user.id);

    res.json({
      message: 'Tree health updated',
      tree,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};
