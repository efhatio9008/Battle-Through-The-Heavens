import { questions } from "./data/dialogue.js";

const byId = new Map(questions.map(question => [question.id, question]));

export function createDialogue() {
  const nextReply = new Map();

  return {
    reply(id) {
      const question = byId.get(id);
      if (!question) return null;
      const index = nextReply.get(id) ?? 0;
      nextReply.set(id, (index + 1) % question.replies.length);
      return question.replies[index];
    },
    reset() {
      nextReply.clear();
    }
  };
}
