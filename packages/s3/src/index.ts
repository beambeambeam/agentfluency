import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type {
  PutObjectCommandInput,
  PutObjectCommandOutput,
  S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const DEFAULT_EXPIRY_SECONDS = 300;
const MAX_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

export type S3StorageConfig = S3ClientConfig & { bucket: string };

type PutObjectInput = Omit<PutObjectCommandInput, "Bucket" | "Key"> & {
  Key: string;
};

export interface S3Storage {
  putObject: (input: PutObjectInput) => Promise<PutObjectCommandOutput>;
  getDownloadUrl: (
    key: string,
    options?: { expiresIn?: number }
  ) => Promise<string>;
  destroy: () => void;
}

export const createS3Storage = ({
  bucket,
  ...config
}: S3StorageConfig): S3Storage => {
  const client = new S3Client(config);

  return {
    putObject(input) {
      return client.send(new PutObjectCommand({ ...input, Bucket: bucket }));
    },

    getDownloadUrl(key, { expiresIn = DEFAULT_EXPIRY_SECONDS } = {}) {
      if (
        !Number.isInteger(expiresIn) ||
        expiresIn < 1 ||
        expiresIn > MAX_EXPIRY_SECONDS
      ) {
        return Promise.reject(
          new RangeError(
            `expiresIn must be between 1 and ${MAX_EXPIRY_SECONDS} whole seconds.`
          )
        );
      }

      return getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        {
          expiresIn,
        }
      );
    },

    destroy() {
      client.destroy();
    },
  };
};
