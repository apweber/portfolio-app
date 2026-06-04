import { jobsHandlers } from "./jobs";
import { companiesHandlers } from "./companies";
import { skillsHandlers } from "./skills";
import { adminHandlers } from "./admin";

export const handlers = [
  ...jobsHandlers,
  ...companiesHandlers,
  ...skillsHandlers,
  ...adminHandlers,
];
