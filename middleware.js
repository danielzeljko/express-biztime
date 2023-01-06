"use strict";

const { BadRequestError } = require("./expressError");

/** Checks that the company put request includes a name and description. */
function checkPutParamsCompany(req, res, next) {
  const { name, description } = req.body;

  if (name === undefined || description === undefined) {
    throw new BadRequestError('Body must include name and description');
  }

  next();
}

/** Checks that the company post request includes a name, code and description. */

function checkPostParamsCompany(req, res, next) {
  const { name, description, code } = req.body;

  if (name === undefined || description === undefined || code === undefined) {
    throw new BadRequestError('Body must include code, name, and description');
  }

  next();
}

/** Checks that the invoice post request includes a comp_code and amt. */

function checkPostParamsInvoice(req, res, next) {
  const { comp_code, amt } = req.body;

  if (comp_code === undefined || amt === undefined) {
    throw new BadRequestError('Body must include comp_code and amt');
  }

  next();
}

/** Checks that the invoice put request includes amt. */

function checkPutParamsInvoice(req, res, next) {
  const { amt } = req.body;

  if (amt === undefined) {
    throw new BadRequestError('Body must include amt');
  }

  next();
}

module.exports = {
  checkPutParamsCompany,
  checkPostParamsCompany,
  checkPostParamsInvoice,
  checkPutParamsInvoice
}

