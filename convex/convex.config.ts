import ltcgCards from "@lunchtable-tcg/cards/convex.config";
import ltcgGuilds from "@lunchtable-tcg/guilds/convex.config";
import ltcgMatch from "@lunchtable-tcg/match/convex.config";
import ltcgStory from "@lunchtable-tcg/story/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(ltcgCards);
app.use(ltcgGuilds);
app.use(ltcgMatch);
app.use(ltcgStory);

export default app;
