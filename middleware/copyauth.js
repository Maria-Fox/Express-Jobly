"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {

    // Go into insomnia and into headers add authorization property w/ valid token.
    const authHeader = req.headers && req.headers.authorization;
    console.log("THIS IS THE HEADER:************")
    console.log(req.headers);
    console.log("this is the authHeader");
    console.log(authHeader);


    if (authHeader) {

      // the token payload originally is the username & isAdmin
      // the client receives a signed token w/ above info & signature.
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      // replaces bearer token w/ empty list and trims

      // The res.locals property is an object that contains response local variables scoped to the request and because of this, it is only available to the view(s) rendered during that request/response cycle (if any).

      res.locals.user = jwt.verify(token, SECRET_KEY);
      console.log("This is the res.locals.user property");
      console.log(res.locals.user);
      // looks like: { username: 'maya1', isAdmin: true, iat: 1666393780 }
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    // throw new UnauthorizedError();
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

// part 3
function ensureAdmin( req, res, next ){
  try {
    if (!res.locals.user || res.locals.user.isAdmin === false)
      throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

function ensureisAdminOrAuthUser(req, res, next) {
  try{

    if(!res.locals.user || 
      !req.params.user || 
      res.locals.user.isAdmin == false && 
      req.params.username == res.locals.user.username){
        return new UnauthorizedError();
    } 
    next()

  } catch (e){
    return next(e);
  }
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureisAdminOrAuthUser
};
