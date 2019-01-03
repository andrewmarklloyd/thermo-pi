const Joi = require('joi')

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();

// define validation for all the env vars
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .allow(['development', 'production'])
    .default('development'),
  OSC_MODE: Joi.string()
    .allow(['true', 'false'])
    .default('false'),
  OSC_SERVER_PORT: Joi.number()
    .default(3000)
}).unknown()
  .required();

const result = Joi.validate(process.env, envVarsSchema);
const error = result.error;
const envVars = result.value;

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  osc: {
    enabled: envVars.OSC_MODE == 'true' ? true : false,
    port: envVars.OSC_SERVER_PORT
  }
};

module.exports = config;
