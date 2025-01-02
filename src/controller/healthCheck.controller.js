import { AsyncHandler } from '../utils/AsyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const healthCheck = AsyncHandler(async (req, res, next) => {
  return res.status(200).json(new ApiResponse(200, 'OK', 'HealthCheck Passed'));
});

export { healthCheck };
