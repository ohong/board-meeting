// Root eve agent definition. The app runtime does not execute this file; it exists so the
// `agent/` tree is a valid eve project and the board members are discoverable as declared subagents.
const agent = {
  description:
    "The Best Board Meeting You've Ever Had — chair-side secretary that convenes the board-member subagents.",
  model: "openai/gpt-5.6-terra",
};

export default agent;
