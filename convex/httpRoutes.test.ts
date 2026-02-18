import { describe, expect, it } from "vitest";
import {
  parseAgentApiKey,
  parseGenerationJobRoute,
  parseSessionPostRoute,
  parseSessionViewRoute,
  parseWorldPatchRoute,
  parseWorldPostRoute,
} from "./httpRoutes";

describe("httpRoutes", () => {
  it("parses agent api key from Authorization header", () => {
    expect(parseAgentApiKey("Bearer ttg_abc123")).toBe("ttg_abc123");
    expect(parseAgentApiKey("Bearer foo_abc123")).toBeNull();
    expect(parseAgentApiKey("Basic ttg_abc123")).toBeNull();
    expect(parseAgentApiKey(null)).toBeNull();
  });

  it("parses session post routes", () => {
    expect(parseSessionPostRoute("/api/vtt/sessions/sess_1/join")).toEqual({
      kind: "join",
      sessionId: "sess_1",
    });
    expect(parseSessionPostRoute("/api/vtt/sessions/sess_2/commands")).toEqual({
      kind: "commands",
      sessionId: "sess_2",
    });
    expect(parseSessionPostRoute("/api/vtt/sessions/sess_2/view")).toBeNull();
  });

  it("parses session view routes", () => {
    expect(parseSessionViewRoute("/api/vtt/sessions/sess_3/view")).toEqual({
      sessionId: "sess_3",
    });
    expect(parseSessionViewRoute("/api/vtt/sessions/sess_3/commands")).toBeNull();
  });

  it("parses world post and patch routes", () => {
    expect(parseWorldPatchRoute("/api/vtt/worlds/world_1")).toEqual({
      worldId: "world_1",
    });
    expect(parseWorldPatchRoute("/api/vtt/worlds/world_1/fork")).toBeNull();

    expect(parseWorldPostRoute("/api/vtt/worlds/world_2/fork")).toEqual({
      kind: "fork",
      worldId: "world_2",
    });
    expect(parseWorldPostRoute("/api/vtt/worlds/world_2/publish")).toEqual({
      kind: "publish",
      worldId: "world_2",
    });
  });

  it("parses generation job route", () => {
    expect(parseGenerationJobRoute("/api/vtt/generation/jobs/job_1")).toEqual({
      jobId: "job_1",
    });
    expect(parseGenerationJobRoute("/api/vtt/generation/jobs")).toBeNull();
  });

  it("decodes encoded ids safely", () => {
    expect(parseSessionViewRoute("/api/vtt/sessions/sess%3Aone/view")).toEqual({
      sessionId: "sess:one",
    });
    expect(parseWorldPostRoute("/api/vtt/worlds/%E0%A4%A/fork")).toBeNull();
  });
});
