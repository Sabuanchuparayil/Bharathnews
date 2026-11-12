import { defineRailway, github, project, service } from "railway/iac";
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "Bharathnews";
export default defineRailway(() => {
  const Bharathnews = service("Bharathnews", {
    source: github("Sabuanchuparayil/Bharathnews", { branch: "main", checkSuites: false }),
    build: { buildCommand: "npm run build", buildEnvironment: "V3", builder: "RAILPACK" },
    start: "npm run start",
    replicas: { "asia-southeast1-eqsg3a": 1 },
    domains: ["thebharathnews.com", "www.thebharathnews.com"],
    networking: { privateNetworkEndpoint: "bharathnews" },
  });

  return project("Bharathnews", {
    variables: { managed: false },
    resources: [Bharathnews],
  });
});
