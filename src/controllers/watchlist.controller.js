import * as watchlistService from '../services/watchlist.service.js';

export const getWatchlist = async (req, res, next) => {
  try {
    const items = await watchlistService.getWatchlist(req.user.id);
    res.status(200).json({
      status: 'success',
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

export const addToWatchlist = async (req, res, next) => {
  try {
    const item = await watchlistService.addToWatchlist(req.user.id, req.body.movieId);
    res.status(201).json({
      status: 'success',
      message: 'Movie added to watchlist',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromWatchlist = async (req, res, next) => {
  try {
    const result = await watchlistService.removeFromWatchlist(req.user.id, req.params.movieId);
    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
};

