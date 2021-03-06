import { Request, Response } from "express";
import * as passport from "passport";
import { ApiError } from "../util/errorHandling";
import { HttpResponseCode } from "../util/errorHandling";
import { AuthLevels } from "../util/user";
import { NextFunction } from "connect";
import { User } from "../db/entity/hub/user";
import { Team } from "../db/entity/hub/team";
import { UserService } from "../services/users";
import { TeamService } from "../services/teams/teamService";

/**
 * A controller for auth methods
 */
export class UserController {
  private userService: UserService;
  private teamService: TeamService;
  constructor(_userService: UserService, _teamService: TeamService) {
    this.userService = _userService;
    this.teamService = _teamService;
  }

  /**
   * Logs in the user
   */
  public login = (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate("local", (err: Error, user: any, info: any) => {
      if (err) {
        return next(new ApiError(HttpResponseCode.INTERNAL_ERROR, err.message));
      }
      if (!user) {
        return res.status(HttpResponseCode.BAD_REQUEST).render("pages/login", { error: info.message });
      }
      req.logIn(user, (err: any) => {
        let redirectRoute: string;

        if (err) {
          return next(new ApiError(HttpResponseCode.INTERNAL_ERROR, err.message));
        }
        if (user.authLevel >= AuthLevels.Volunteer)
          res.locals.isVolunteer = true;
        if (user.authLevel >= AuthLevels.Organizer)
          res.locals.isOrganizer = true;
        if (user.authLevel > AuthLevels.Attendee) {
          redirectRoute = "/hardware/loancontrols";
        } else {
          redirectRoute = "/";
        }
        redirectRoute = req.session.redirectTo || redirectRoute;
        delete req.session.redirectTo;
        res.redirect(redirectRoute);
      });
    })(req, res);
  };

  /**
   * Gets the profile page for the currently logged in user
   */
  public profile = async (req: Request, res: Response, next: NextFunction) => {
    let profile: User = req.user;
    // Use this variable to hide some details in the page
    // When true, the buttons to modify the users profile are hidden
    let isRestrictedView: boolean = false;

    const reqParam: number = Number(req.url.slice(1));
    const isReqParamValid: boolean = !isNaN(reqParam);
    if (isReqParamValid) {
      profile = await this.userService.getUserByIDFromHub(reqParam);
      isRestrictedView = true;
      if (!profile)
        return next();
    }

    let userTeam: User[] = undefined;
    let teamEntity: Team = undefined;

    if (profile.team) {
      userTeam = await this.teamService.getUsersTeamMembers(profile.team.teamCode);
      teamEntity = await this.teamService.getTeam(profile.team.teamCode);
    }

    const teamMembers: Array<Object> = [];
    if (userTeam) {
      userTeam.forEach((user: User) => {
        teamMembers.push({ "name": user.name });
      });
    }

    res.render("pages/profile", { user: profile, team: teamMembers, teamEntity: teamEntity, restrict: isRestrictedView });
  };

  /**
   * Logs out the user
   */
  public logout(req: Request, res: Response): void {
    req.logout();
    res.redirect("/login");
  }

  /**
   * Used for testing purposes, to be removed in next pull request
   */
  public test (req: Request, res: Response): void {
    res.send({ message: "Authorized" });
  }
}