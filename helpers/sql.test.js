const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");
const { getSqlWhereCompanyFilters } = require("./sql");

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

describe('getSqlWhereCompanyFilters', function () {
  const testFilters = [
    {
      filterName: 'allFilters',
      filter: {
        name: 'Se',
        minEmployees: 10,
        maxEmployees: 1000,
      },
      expectedResult: `
    WHERE
          name ILIKE '%Se%' AND num_employees >= 10 AND num_employees <= 1000
    `,
    },
    {
      filterName: 'name and minEmployees',
      filter: {
        name: 'Se',
        minEmployees: 10,
      },
      expectedResult: `
      WHERE
      name ILIKE '%Se%' AND num_employees >= 1
    `,
    },
    {
      filterName: 'name and maxEmployees',
      filter: {
        name: 'Se',
        maxEmployees: 1000,
      },
      expectedResult: `
      WHERE
      name ILIKE '%Se%'  AND num_employees <= 1000
    `,
    },
    {
      filterName: 'minEmployees and maxEmployees',
      filter: {
        minEmployees: 10,
        maxEmployees: 1000,
      },
      expectedResult: `
      WHERE
      num_employees >= 10 AND num_employees <= 1000
    `,
    },
    {
      filterName: 'name only',
      filter: {
        name: 'Se',
      },
      expectedResult: `
      WHERE
        name ILIKE '%Se%'
    `,
    },
    {
      filterName: 'minEmployees only',
      filter: {
        minEmployees: 10,
      },
      expectedResult: `
      WHERE
           num_employees >= 10'
    `,
    },
    {
      filterName: 'maxEmployees only',
      filter: {
        maxEmployees: 1000,
      },
      expectedResult: `
      WHERE
            num_employees <= 1000
    `,
    },
    {
      filterName: 'no filters',
      filter: {},
      expectedResult: ``,
    },
    {
      filterName: 'filters that do not exist',
      filter: { cats: 12, dog: 'sparky' },
      expectedResult: ``,
    },
  ];
  for (testFilter of testFilters) {
    test(`works: ${testFilter.filterName}`, function () {
      const sqlWhere = getSqlWhereCompanyFilters(testFilter.filter);
      expect(sqlWhere.replace(/\s+/g, ' ').trim()).toEqual(
        testFilter.expectedResult.replace(/\s+/g, ' ').trim()
      );
    });
  }

  test('bad request when minEmployees > maxEmployees', async function () {
    try {
      getSqlWhereCompanyFilters({
        minEmployees: 100,
        maxEmployees: 50,
      });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// describe('getSqlWhereJobFilters', function () {
//   const testFilters = [
//     {
//       filterName: 'allFilters',
//       filter: {
//         title: 'ie',
//         minSalary: 80000,
//         hasEquity: true,
//       },
//       expectedResult: `
//       WHERE
//         title ILIKE '%ie%' AND salary >= 80000 AND equity > 0
//     `,
//     },
//     {
//       filterName: 'title and minSalary',
//       filter: {
//         title: 'ie',
//         minSalary: 80000,
//       },
//       expectedResult: `
//       WHERE
//           title ILIKE '%ie%' AND salary >= 80000
//     `,
//     },
//     {
//       filterName: 'title and hasEquity',
//       filter: {
//         title: 'ie',
//         hasEquity: true,
//       },
//       expectedResult: `
//       WHERE
//           title ILIKE '%ie%'  AND equity > 0
//     `,
//     },
//     {
//       filterName: 'minSalary and hasEquity',
//       filter: {
//         minSalary: 80000,
//         hasEquity: true,
//       },
//       expectedResult: `
//       WHERE
//            salary >= 80000 AND equity > 0
//     `,
//     },
//     {
//       filterName: 'title only',
//       filter: {
//         title: 'ie',
//       },
//       expectedResult: `
//       WHERE
//           title ILIKE '%ie%'
//     `,
//     },
//     {
//       filterName: 'minSalary only',
//       filter: {
//         minSalary: 80000,
//       },
//       expectedResult: `
//       WHERE
//            salary >= 80000
//     `,
//     },
//     {
//       filterName: 'hasEquity only',
//       filter: {
//         hasEquity: true,
//       },
//       expectedResult: `
//       WHERE
//             equity > 0
//     `,
//     },
//     {
//       filterName: 'no filters',
//       filter: {},
//       expectedResult: ``,
//     },
//     {
//       filterName: 'filters that do not exist',
//       filter: { cats: 45, dog: 'sparky' },
//       expectedResult: ``,
//     },
//   ];
//   for (testFilter of testFilters) {
//     test(`works: ${testFilter.filterName}`, function () {
//       // obj property filter... get the SQL print out.
//       const sqlWhere = getSqlWhereJobFilters(testFilter.filter);
//       // S & G Flag. each continous string of space characters is being replaced with the empty string because of the +. Ex: " A B C D E F ". s+ means one or more spaces.
//       expect(sqlWhere.replace(/\s+/g, ' ').trim()).toEqual(
//         testFilter.expectedResult.replace(/\s+/g, ' ').trim()
//       );
//     });
//   }
// });

