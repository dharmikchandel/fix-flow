import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { selectAssignee, type AssignmentCandidate } from "./assignmentService.js";

function engineer(overrides: Partial<AssignmentCandidate> & Pick<AssignmentCandidate, "id" | "name">): AssignmentCandidate {
  return {
    expertise: [],
    workload: 0,
    maxCapacity: 5,
    available: true,
    ...overrides,
  };
}

describe("selectAssignee", () => {
  test("picks the matching-expertise engineer with the lowest workload", () => {
    const engineers = [
      engineer({ id: "1", name: "Busy Specialist", expertise: ["auth"], workload: 3 }),
      engineer({ id: "2", name: "Free Specialist", expertise: ["auth"], workload: 1 }),
      engineer({ id: "3", name: "Non-specialist", expertise: ["ui"], workload: 0 }),
    ];

    const { assignee } = selectAssignee(engineers, "auth");
    assert.equal(assignee.id, "2");
  });

  test("falls back to any available under-capacity engineer when no specialist is free", () => {
    const engineers = [
      engineer({ id: "1", name: "UI dev", expertise: ["ui"], workload: 2 }),
      engineer({ id: "2", name: "Docs writer", expertise: ["docs"], workload: 0 }),
    ];

    const { assignee, reason } = selectAssignee(engineers, "payment");
    assert.equal(assignee.id, "2");
    assert.match(reason, /No payment specialist available/);
  });

  test("excludes engineers who are at or over capacity", () => {
    const engineers = [
      engineer({ id: "1", name: "Maxed out", expertise: ["auth"], workload: 5, maxCapacity: 5 }),
      engineer({ id: "2", name: "Has room", expertise: ["auth"], workload: 4, maxCapacity: 5 }),
    ];

    const { assignee } = selectAssignee(engineers, "auth");
    assert.equal(assignee.id, "2");
  });

  test("excludes unavailable engineers even if they have capacity and expertise", () => {
    const engineers = [
      engineer({ id: "1", name: "On leave", expertise: ["auth"], workload: 0, available: false }),
      engineer({ id: "2", name: "Available", expertise: ["auth"], workload: 4 }),
    ];

    const { assignee } = selectAssignee(engineers, "auth");
    assert.equal(assignee.id, "2");
  });

  test("throws when no engineer has capacity", () => {
    const engineers = [
      engineer({ id: "1", name: "Maxed", expertise: ["auth"], workload: 5, maxCapacity: 5 }),
    ];

    assert.throws(() => selectAssignee(engineers, "auth"));
  });

  test("module matching is case-insensitive", () => {
    const engineers = [engineer({ id: "1", name: "Auth dev", expertise: ["auth"], workload: 0 })];
    const { reason } = selectAssignee(engineers, "AUTH");
    assert.match(reason, /is a AUTH expert/);
  });
});
