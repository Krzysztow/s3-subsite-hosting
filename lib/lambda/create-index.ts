import {
  S3Client,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  S3ObjectDeletedNotificationEvent,
  S3ObjectCreatedNotificationEvent,
} from "aws-lambda";

console.log("Loading function");

const s3 = new S3Client({ apiVersion: "2006-03-01" });

const INDEX_PAGE = "index.html";

export const handler = async (
  event: S3ObjectCreatedNotificationEvent | S3ObjectDeletedNotificationEvent,
  _: any
) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  if (event?.detail?.object?.key === INDEX_PAGE) {
    console.warn("Got event for the index.html, but should NOT!");
    return "Skipped geneartion";
  }

  const bucketName = getRequiredEnv("BUCKET_NAME");
  const bucketBaseUrl = getRequiredEnv("BUCKET_BASE_URL");

  try {
    const prefixes = await getBucketPrefixes(bucketName);
    console.log(`Prefixes: ${prefixes}`);

    const data = generateIndexData(bucketBaseUrl, prefixes);
    console.log(data);

    uploadIndexData(bucketName, data);
    console.log(
      `Finished regeneartion of ${bucketBaseUrl + "/" + INDEX_PAGE}!`
    );
  } catch (e) {
    throw e;
  }

  return "Generated";
};

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value.length === 0) {
    throw new Error(`Environment variable ${name} not defined!`);
  }

  console.log(`Got env variable env[${name}]=${value}`);
  return value;
};

const getBucketPrefixes = async (bucketName: string): Promise<string[]> => {
  const objects: ListObjectsV2CommandOutput = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucketName,
      Delimiter: "/",
    })
  );

  const prefixes = (objects.CommonPrefixes ?? [])
    .map((p) => p?.Prefix)
    .filter((p) => undefined !== p) as string[];
  return prefixes;
};

const generateIndexData = (baseUrl: string, prefixes: string[]): string => {
  return `
      <!doctype html>
      <html>
        <head>
          <title>Subbuckets index.html</title>
        </head>
        <body>
          Available subsites:
          <ul id="links">
            ${prefixes
              ?.map(
                (p) => `<li><a href="${baseUrl}/${p}index.html">${p}</a></li>`
              )
              .join("\n")}
          </ul>
        </body>
      </html>
    `;
};

const uploadIndexData = async (bucketName: string, data: string) => {
  const putResult = await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: INDEX_PAGE,
      Body: data,
      ContentType: "text/html",
    })
  );
};
