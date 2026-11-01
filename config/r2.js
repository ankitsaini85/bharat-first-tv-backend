const { S3Client } = require("@aws-sdk/client-s3");

const isObjectStorageEnabled = () => process.env.OBJECT_STORAGE === "1";

let s3Client = null;

const getR2Client = () => {
  if (!isObjectStorageEnabled()) return null;
  if (s3Client) return s3Client;

  const { R2_ENDPOINT, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ENDPOINT || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error(
      "R2_ENDPOINT, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set when OBJECT_STORAGE=1"
    );
  }

  s3Client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  return s3Client;
};

module.exports = { getR2Client, isObjectStorageEnabled };
