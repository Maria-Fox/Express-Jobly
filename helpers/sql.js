const { BadRequestError } = require("../expressError");

// dataToUpdate is an obj. (is the req.body )
// jsToSql : object, specify which items to update to SQL. Already in JS format.
function sqlForPartialUpdate(dataToUpdate, jsToSql) {

  // We're grabbing the keys (from req.body) and assigning to variable "keys". Returns an array of keys.
  console.log(dataToUpdate);
  const keys = Object.keys(dataToUpdate);

  // If there are no keys we return user error. 
  if (keys.length === 0) throw new BadRequestError("No data");

  // here, we loop through the keys array. Grabbing the the ColName (column name) key and attach the corresponding index value to that property.
  // Retuns an Array with a sentence "key" = "value" EX:
  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']

  const cols = keys.map((colName, idx) =>
      // .... = { index +1 } is actually variable order [$1, $2 .. etc].
      // variable inserts are one-indexed so we add one.
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    // returns an obj {setCols, dataToUpdate}. Set Cols: every column needing an update (and varaible index). Values, corresponding values to column edit.
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
