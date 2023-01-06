'use strict';

const express = require('express');
const { NotFoundError, BadRequestError } = require('../expressError');
const { checkPutParamsInvoice, checkPostParamsInvoice } = require("../middleware")
const db = require('../db');

let router = new express.Router();

const EMPTY_BODY_MSG = "Request must include body"

/** Return info on invoices: like {invoices: [{id, comp_code}, ...]} */

router.get('/', async function (req, res) {

  const results = await db.query(`
    SELECT id, comp_code
      FROM invoices
      ORDER BY comp_code`
  );
  const invoices = results.rows;

  return res.json({ invoices });
});

/**
 * Returns obj on given invoice.
 * If invoice cannot be found, returns 404.
 * Returns {invoice: {id, amt, paid, add_date, paid_date,
 * company: {code, name, description}}
 */

router.get('/:id', async function (req, res) {
  const id = req.params.id;

  const iResults = await db.query(`
    SELECT id, amt, paid, add_date, paid_date
      FROM invoices
      WHERE id = $1`, [id]
  );

  const cResults = await db.query(`
  SELECT code, name, description
    FROM companies AS c
      JOIN invoices AS i
        ON c.code = i.comp_code
    WHERE i.id = $1`, [id]
  );

  const invoice = iResults.rows[0];

  if (invoice === undefined) {
    throw new NotFoundError(`No invoice with id: ${id}`);
  }

  invoice.company = cResults.rows[0];

  return res.json({ invoice });
});

/**
 * Adds an invoice.
 * Needs to be passed in JSON body of: {comp_code, amt}
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.post('/', checkPostParamsInvoice, async function(req, res) {
  if (req.body === undefined) {
    throw new BadRequestError(EMPTY_BODY_MSG);
  }
  const { comp_code, amt } = req.body;
  // In reality would do a query for comp to ensure it exists before proceeding
  const results = await db.query(`
    INSERT INTO invoices (comp_code, amt)
      VALUES ($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt]
  );
  const invoice = results.rows[0];

  return res.status(201).json({ invoice });
});

/**
 * Updates an invoice.
 * If invoice cannot be found, returns a 404.
 * Needs to be passed in a JSON body of {amt}
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 * */
router.put('/:id', checkPutParamsInvoice, async function(req, res) {
  if (req.body === undefined) {
    throw new BadRequestError(EMPTY_BODY_MSG);
  }
  const { amt } = req.body;
  const id = req.params.id;

  const results = await db.query(`
    UPDATE invoices
      SET amt = $1
      WHERE id = $2
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, id]
  );
  const invoice = results.rows[0];

  if (invoice === undefined) throw new NotFoundError(`No invoice with id: ${id}`);

  return res.json({ invoice });
});

/**
 * Deletes an invoice.
 * If invoice cannot be found, returns a 404.
 * Returns: {status: "deleted"}
 */
router.delete('/:id', async function(req, res) {
  const id = req.params.id;

  const results = await db.query(`
    DELETE
      FROM invoices
      WHERE id = $1
      RETURNING id`, [id]);
  const invoice = results.rows[0];

  if (invoice === undefined) throw new NotFoundError(`No invoice with id: ${id}`);

  return res.json({ status: 'deleted' });
});

module.exports = router;