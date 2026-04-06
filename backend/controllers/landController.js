import * as landService from '../services/landService.js';

export const create = async (req, res) => {
  const { name, address, latitude, longitude, area_sqft, land_type, soil_type, water_availability, water_source, description, photos } = req.body;

  if (!name || !address) {
    return res.status(400).json({ message: 'Name and address are required' });
  }

  try {
    const newLand = await landService.createLand(
      { name, address, latitude, longitude, area_sqft, land_type, soil_type, water_availability, water_source, description, photos },
      req.user.id
    );

    res.status(201).json({
      message: 'Land added successfully',
      land: newLand,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const lands = await landService.getAllLands();
    res.json(lands);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMine = async (req, res) => {
  try {
    const lands = await landService.getMyLands(req.user.id);
    res.json(lands);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getById = async (req, res) => {
  try {
    const land = await landService.getLandById(req.params.id);
    res.json(land);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

// NEW: Get Land Detail with all related data
export const getDetail = async (req, res) => {
  try {
    const landDetail = await landService.getLandDetail(req.params.id, req.user.id);
    res.json(landDetail);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

export const update = async (req, res) => {
  try {
    const land = await landService.updateLand(req.params.id, req.user.id, req.body);
    res.json({
      message: 'Land updated',
      land,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await landService.deleteLand(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

export const addPhoto = async (req, res) => {
  const { photo_url, caption } = req.body;

  if (!photo_url) {
    return res.status(400).json({ message: 'Photo URL is required' });
  }

  try {
    const land = await landService.addLandPhoto(req.params.id, req.user.id, photo_url, caption);
    res.json({
      message: 'Photo added',
      land,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};