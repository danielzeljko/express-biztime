'use strict';

const express = require('express');
const { NotFoundError, BadRequestError } = require('../expressError');

const db = require('../db');

let router = new express.Router();

/** Returns list of companies, like {companies: [{code, name}, ...]} */
router.get('/', async function (req, res) {
  // Order by name (or something in general)
  const results = await db.query(`
    SELECT code, name
      FROM companies`
  );
  const companies = results.rows;

  return res.json({ companies });
});

/**
 * Return obj of company: {company: {code, name, description}}
 * If the company given cannot be found, this should return a
 * 404 status response.
 */
router.get('/:code', async function(req, res) {
  const code = req.params.code;

  const results = await db.query(`
    SELECT code, name, description
      FROM companies
      WHERE code = $1`, [code]
  );
  const company = results.rows[0];

  if (company === undefined) {
    throw new NotFoundError(`No company with code: ${code}`);
  }

  return res.json({ company });
});

/** Adds a company.
 * Needs to be given JSON like: {code, name, description}
 * Returns obj of new company: {company: {code, name, description}}
 * */
router.post('/', async function(req, res) {
  if (req.body === undefined) throw new BadRequestError('Request must include body');

  const { code, name, description } = req.body;
  // Add middleware that does the following validation for us
  if (code === undefined || name === undefined || description === undefined) {
    throw new BadRequestError('Body must include code, name, and description');
  }

  const results = await db.query(`
    INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`, [code, name, description]
  );
  const company = results.rows[0];

  return res.status(201).json({ company });
});

/** Edit existing company.
 * Should return 404 if company cannot be found.
 * Needs to be given JSON like: {name, description}
 * Returns update company object: {company: {code, name, description}}
 * */
router.put('/:code', async function(req, res) {
  // Make global variable for this type of badrequesterror message
  if (req.body === undefined) throw new BadRequestError('Request must include body');

  const { name, description } = req.body;
  const code = req.params.code;
  // Add middleware that does the following validation for us
  if (name === undefined || description === undefined) {
    throw new BadRequestError('Body must include name and description');
  }

  const results = await db.query(`
    UPDATE companies
      SET name=$1, description=$2
      WHERE code = $3
      RETURNING code, name, description`, [name, description, code]);
  const company = results.rows[0];

  if (company === undefined) throw new NotFoundError(`No company with code: ${code}`);

  return res.json({ company });
});

/** Deletes company.
 * Should return 404 if company cannot be found.
 * Returns {status: "deleted"}
 * */
router.delete('/:code', async function(req, res) {
  const code = req.params.code;

  const compResults = await db.query(`
    SELECT code, name, description
      FROM companies
      WHERE code = $1`, [code]
  );
  const company = compResults.rows[0];

  if (company === undefined) throw new NotFoundError(`No company with code: ${code}`);

  const results = await db.query(`
    DELETE
      FROM companies
      WHERE code = $1`, [code]
      // Return something and check if that something is something for error handling
  );

  return res.json({ status: 'deleted' });
});


module.exports = router;