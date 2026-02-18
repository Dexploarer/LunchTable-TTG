import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Advance the campaign day every 24 hours at 6:00 AM UTC (start of school day)
crons.daily(
  "advanceCampaignDay",
  { hourUTC: 6, minuteUTC: 0 },
  internal.dailyBriefing.advanceCampaignDay,
);

export default crons;
