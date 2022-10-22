"use strict";

const { query } = require("express");
const db = require("../db");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    return companiesRes.rows;
  }


  /** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

  static async findAllByFilter(queryItems) { 
    let sqlQueryWriteUp = [];
    let queryValues = [];

    // deconstructs any or all items coming in from the request query. Comes in as key, value for each filter.
    let { name, minEmployees, maxEmployees } = queryItems;

    if(name){
      queryValues.push(`%${name}%`);
      // removed $
      sqlQueryWriteUp.push(`name ILIKE ${name}`);
    };

    if(minEmployees && !maxEmployees){
      if(minEmployees > maxEmployees){
        return new BadRequestError("The minimum number of employees must be smaller than the maximum number of company employees. To fix lower the min number.", 400);
      } else{
        queryValues.push(minEmployees);
        sqlQueryWriteUp.push(`num_employees >= ${minEmployees}`);
      };
    };

    if(maxEmployees && !minEmployees){
      queryValues.push(maxEmployees);
      sqlQueryWriteUp.push(`num_employees <= ${maxEmployees}`);
    };

    if(minEmployees && maxEmployees){
      if(minEmployees > maxEmployees){
        return new BadRequestError("Please update employee search criteria so min is smaller than max employees.", 400);
      } else {
        queryValues.push(minEmployees, maxEmployees)
        sqlQueryWriteUp.push(`num_employees BETWEEN ${minEmployees} AND ${maxEmployees}`);
      };
    };

    // group all the queries together & send off to db.

    let baseQuery = db.query(
      `SELECT handle, name, num_employees, description , logo_url 
      FROM companies`
    );

    // for each query the WHERE clause will be added using the queryValues passed in.
    baseQuery += " WHERE " + sqlQueryWriteUp.join(" AND ");
    // this is ordering the responses by name.. the name query is not required.
    baseQuery += " ORDER BY name";

    
    console.log(baseQuery);
    console.log(queryValues);
    // it's giving me a parse syntax error when reading the queryValue.. [values]
    const filterResponse = await db.query(baseQuery, queryValues);
    console.log(filterResponse);
    console.log(filterResponse.rows);
    return filterResponse.rows;
    

  };

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  // run with -i flag . They need to run in band (in order, not at the same time)


  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
