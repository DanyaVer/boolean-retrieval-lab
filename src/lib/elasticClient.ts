import { Client } from "@elastic/elasticsearch";

// In a real production environment, this URL would come from environment variables.
// Since we are running locally via Docker with security disabled, we connect directly.
const ELASTIC_URL = process.env.ELASTIC_URL || "http://localhost:9200";

export const elasticClient = new Client({
  node: ELASTIC_URL,
});

// The name of the index we will use for this lab
export const SPORTS_INDEX_NAME = "sports_teams";
