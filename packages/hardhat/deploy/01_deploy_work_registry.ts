import { deployScript, artifacts } from "../rocketh/deploy.js";

export default deployScript(
  async env => {
    const { deployer } = env.namedAccounts;

    await env.deploy("WorkRegistry", {
      account: deployer,
      artifact: artifacts.WorkRegistry,
      args: [deployer],
    });
  },
  {
    tags: ["WorkRegistry"],
  },
);
