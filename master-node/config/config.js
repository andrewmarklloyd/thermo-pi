const Joi = require('joi')

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();

// define validation for all the env vars
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .allow(['development', 'production'])
    .default('development'),
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_SHEET_ID: Joi.string().required(),
  AUTHORIZED_USERS: Joi.string().required()
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
  google: {
    client: {
      id: process.env.GOOGLE_CLIENT_ID,
      secret: process.env.GOOGLE_CLIENT_SECRET
    },
    sheetId: process.env.GOOGLE_SHEET_ID
  },
  authorizedUsers: process.env.AUTHORIZED_USERS.split(' ')
};

module.exports = config;
