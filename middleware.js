"use strict";

const { BadRequestError } = require("./expressError");

/** Checks that the put request includes a name and description. */
function checkPutParams(req, res, next) {
  const { name, description } = req.body;

  if (name === undefined || description === undefined) {
    throw new BadRequestError('Body must include name and description');
  }

  next();
}

/** Checks that the post request includes a name, code and description. */

function checkPostParams(req, res, next) {
  const { name, description, code } = req.body;

  if (name === undefined || description === undefined || code === undefined) {
    throw new BadRequestError('Body must include code, name, and description');
  }

  next();
}

module.exports = {checkPutParams,checkPostParams}

