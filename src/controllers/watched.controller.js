import * as watchedService from '../services/watched.service.js';

export const getWatched = async (req, res, next) => {
  try {
    const items = await watchedService.getWatchedHistory(req.user.id);
    res.status(200).json({
      status: 'success',
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

export const addWatched = async (req, res, next) => {
  try {
    const item = await watchedService.addWatchedMovie(req.user.id, req.body);
    res.status(201).json({
      status: 'success',
      message: 'Movie marked as watched',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getWatched,
  addWatched,
};

