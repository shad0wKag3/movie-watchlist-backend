import * as authService from '../services/auth.service.js';

export const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json({
      status: 'success',
      message: 'Authentication successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
};

