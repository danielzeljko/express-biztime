'use strict';

const express = require('express');
const { NotFoundError, BadRequestError } = require('../expressError');
const { checkPutParamsCompany, checkPostParamsCompany } = require("../middleware")
const db = require('../db');

let router = new express.Router();

const EMPTY_BODY_MSG = "Request must include body"

/** Returns list of companies, like {companies: [{code, name}, ...]} */
router.get('/', async function (req, res) {
  const results = await db.query(`
    SELECT code, name
      FROM companies
      ORDER BY name`
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

  const cResults = await db.query(`
    SELECT code, name, description
      FROM companies
      WHERE code = $1`, [code]
  );
  const company = cResults.rows[0];

  if (company === undefined) {
    throw new NotFoundError(`No company with code: ${code}`);
  }

  const iResults = await db.query(`
    SELECT id
      FROM invoices
      WHERE comp_code = $1`, [code]);
  const invoices = iResults.rows;
  company.invoices = invoices.map(i => i.id);

  return res.json({ company });
});

/** Adds a company.
 * Needs to be given JSON like: {code, name, description}
 * Returns obj of new company: {company: {code, name, description}}
 * */
router.post('/', checkPostParamsCompany, async function(req, res) {
  if (req.body === undefined) throw new BadRequestError(EMPTY_BODY_MSG);

  const { code, name, description } = req.body;

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
router.put('/:code', checkPutParamsCompany, async function(req, res) {
  // Make global variable for this type of badrequesterror message
  if (req.body === undefined) throw new BadRequestError(EMPTY_BODY_MSG);

  const { name, description } = req.body;
  const code = req.params.code;

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

  const results = await db.query(`
    DELETE
    FROM companies
    WHERE code = $1
    RETURNING code`,
    [code]);

  const company = results.rows[0];

  if (company === undefined) throw new NotFoundError(`No company with code: ${code}`);

  return res.json({ status: 'deleted' });
});


module.exports = router;