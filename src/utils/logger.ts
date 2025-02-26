import { pino } from "pino";

import loggerConfig from "../configs/logger.config.js";

export default pino(loggerConfig);
