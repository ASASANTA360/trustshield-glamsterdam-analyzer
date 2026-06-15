type DatabaseStatus = {
  configured: boolean;
  uri?: string;
  databaseName: string;
};

function getDatabaseStatus(): DatabaseStatus {
  const uri = process.env.MONGODB_URI;
  const status: DatabaseStatus = {
    configured: Boolean(uri),
    databaseName: uri ? new URL(uri).pathname.replace(/^\//, "") || "trustshield" : "trustshield",
  };
  if (uri) {
    status.uri = uri;
  }
  return status;
}

function getScanCollectionName(): string {
  return "scans";
}

module.exports = { getDatabaseStatus, getScanCollectionName };
