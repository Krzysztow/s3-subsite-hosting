import {
  S3Client,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  S3ObjectCreatedNotificationEvent,
  S3ObjectDeletedNotificationEvent,
  S3ObjectDeletedNotificationEventDeleteObjectDetail,
} from "aws-lambda";

console.log("Loading function");

const s3 = new S3Client({ apiVersion: "2006-03-01" });

const INDEX_PAGE = "index.html";
const BUCKET_NAME =
  "subsitedeploymentsstack-subsitesdeploymentssubsit-rw8uid4891g1";
const BASE_URL =
  "https://subsitedeploymentsstack-subsitesdeploymentssubsit-rw8uid4891g1.s3.eu-west-1.amazonaws.com";

export const handler = async (
  event: S3ObjectCreatedNotificationEvent | S3ObjectCreatedNotificationEvent,
  _: any
) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  if (event?.detail?.object?.key === INDEX_PAGE) {
    console.warn("Got event for the index.html, but should NOT!");
    return "Skipped geneartion";
  }

  try {
    const prefixes = await getBucketPrefixes(BUCKET_NAME);
    console.log(`Prefixes: ${prefixes}`);

    const data = generateIndexData(BASE_URL, prefixes);
    console.log(data);

    uploadIndexData(BUCKET_NAME, data);
    console.log("Finished!");
  } catch (e) {
    throw e;
  }

  return "Generated";
};

const getBucketPrefixes = async (bucketName: string): Promise<string[]> => {
  const objects: ListObjectsV2CommandOutput = await s3.send(
    new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Delimiter: "/",
    })
  );

  const prefixes = (objects.CommonPrefixes?.filter((p) => undefined !== p).map(
    (p) => p.Prefix
  ) ?? []) as string[];
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
                (p) => `<li><a href="${BASE_URL}/${p}index.html">${p}</a></li>`
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
      Bucket: BUCKET_NAME,
      Key: INDEX_PAGE,
      Body: data,
      ContentType: "text/html",
    })
  );
};
