'use strict';

const express = require('express');
const { NotFoundError, BadRequestError } = require('../expressError');
// const {checkPutParams, checkPostParams} = require("../middleware")
const db = require('../db');

let router = new express.Router();

// const EMPTY_BODY_MSG = "Request must include body"

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

module.exports = router;