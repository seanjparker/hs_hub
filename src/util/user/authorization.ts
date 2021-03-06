import { Request, Response, NextFunction } from "express";
import { AuthLevels } from "./authLevels";
import { User } from "../../db/entity/hub";

/**
 * Checks if the request's sender is logged in
 * @param req The request
 * @param res The response
 * @param next The next handler
 */
export const checkIsLoggedIn = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    req.session.redirectTo = req.originalUrl;
    return res.redirect("/login");
  }
  if ((req.user as User).authLevel >= AuthLevels.Volunteer) {
    res.locals.isVolunteer = true;
  }
  if ((req.user as User).authLevel >= AuthLevels.Organizer) {
    res.locals.isOrganizer = true;
  }
  return next();
};

/**
 * Checks if the request's sender is logged in
 * and has the authorization level of at least a volunteer
 * @param req The request
 * @param res The response
 * @param next The next handler
 */
export const checkIsVolunteer = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || (req.user as User).authLevel < AuthLevels.Volunteer) {
    req.session.redirectTo = req.originalUrl;
    return res.redirect("/login");
  }
  res.locals.isVolunteer = true;
  if ((req.user as User).authLevel >= AuthLevels.Organizer) {
    res.locals.isOrganizer = true;
  }
  return next();
};

/**
 * Checks if the request's sender is logged in
 * and has the authorization level of at least an organizer
 * @param req The request
 * @param res The response
 * @param next The next handler
 */
export const checkIsOrganizer = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || (req.user as User).authLevel < AuthLevels.Organizer) {
    req.session.redirectTo = req.originalUrl;
    return res.redirect("/login");
  }
  res.locals.isVolunteer = true;
  res.locals.isOrganizer = true;
  return next();
};