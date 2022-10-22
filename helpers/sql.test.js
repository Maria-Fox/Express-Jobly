const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

// WARNING: this function can set a new password or make a user an admin.
//    * Callers of this function must be certain they have validated inputs to this or a serious security risks are opened.


describe("sqlForPartialUpdate", function () {

  // in the users.js model the values are defined as "first_name", run through the function, then redefined, "first_name AS firstName .. etc."

  let jsToSqlObj = 
    {
      firstName: "firstName",
      lastName: "lastName",
      isAdmin: "isAdmin",
    }

  // field1 : value1
  let reqBody  = { lastName : "New last name" }
  

  test("works: updates user lastName", function () {
  
    const update = sqlForPartialUpdate(reqBody, jsToSqlObj);

    expect(update).toEqual(
      {setCols: "\"lastName\"=$1", values : ["New last name"]})
  });

  test("works: updates multiple items", function () {

    let update = sqlForPartialUpdate({ firstName : "New First Name", lastName : "New Last Name" }, jsToSqlObj);

    // when there are multiple edits they are separated by a comma.
    expect(update).toEqual({setCols : "\"firstName\"=$1, \"lastName\"=$2", values : ["New First Name", "New Last Name"]});

  });

  // I would like to test returning a BadRequestError...
  // test("Returns Bad Request Error", function () {
  //   // returns bad request if no keys/ columns for edits are found.

  //   let invalidCoumns = {};
  //   let badRequest = sqlForPartialUpdate(invalidCoumns, jsToSqlObj);

  //   // expect(badRequest).toEqual({"message": "No data"});
  //   expect(badRequest.statusCode).toBe(400);
  // });
});


