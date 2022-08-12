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
import {
  SUBSITE_DELIMITER,
  SUBSITE_PREFIX,
  INDEX_DOC,
  SUBSITE_DIR,
} from "../subsite-deployments";

console.log("Loading function");

const s3 = new S3Client({ apiVersion: "2006-03-01" });

export const handler = async (
  event: S3ObjectCreatedNotificationEvent | S3ObjectDeletedNotificationEvent,
  _: any
) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  if (event?.detail?.object?.key === INDEX_DOC) {
    console.warn("Got event for the index.html, but should NOT!");
    return "Skipped geneartion";
  }

  const bucketName = getRequiredEnv("BUCKET_NAME");
  const bucketBaseUrl = getRequiredEnv("BUCKET_BASE_URL");

  try {
    const prefixes = await getBucketPrefixes(bucketName);
    console.log(`Prefixes: ${JSON.stringify(prefixes)}`);

    const data = generateIndexData(bucketBaseUrl, prefixes);
    console.log(data);

    await uploadIndexData(bucketName, data);
    console.log(`Finished regeneartion of ${bucketBaseUrl + "/" + INDEX_DOC}!`);
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

interface PrefixesData {
  name: string;
  path: string;
}

const getBucketPrefixes = async (
  bucketName: string
): Promise<PrefixesData[]> => {
  const objects: ListObjectsV2CommandOutput = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: SUBSITE_DIR,
      Delimiter: SUBSITE_DELIMITER,
    })
  );

  const prefixes = (objects.CommonPrefixes ?? [])
    .map((p) => p?.Prefix)
    .filter((p) => undefined !== p) as string[];
  return prefixes.map((p) => {
    return { name: p.substring(SUBSITE_DIR.length), path: p };
  });
};

const generateIndexData = (
  baseUrl: string,
  prefixes: PrefixesData[]
): string => {
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
                (p) =>
                  `<li><a href="${baseUrl}/${p.path}index.html">${p.name}</a></li>`
              )
              .join("\n")}
          </ul>
        </body>
      </html>
    `;
};

const uploadIndexData = async (bucketName: string, data: string) => {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: INDEX_DOC,
      Body: data,
      ContentType: "text/html",
    })
  );
};
