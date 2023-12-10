const env = process.env.NODE_ENV || 'development';
const config = require('../../config/config')[env];
const { S3Client, ListBucketsCommand, CreateBucketCommand,PutPublicAccessBlockCommand,DeletePublicAccessBlockCommand, DeleteBucketCommand, PutObjectAclCommand, PutObjectCommand, DeleteObjectCommand, GetObjectCommand} = require("@aws-sdk/client-s3");
const REGION = config.AWS_SERVICES.SQS.region;
const credentials = {
        accessKeyId: config.AWS_SERVICES.S3.accessKeyId,
        secretAccessKey: config.AWS_SERVICES.S3.secretAccessKey
}
if(!credentials || !credentials.accessKeyId || !credentials.secretAccessKey) throw Error('AWS S3: credentials not found')
const s3Client = new S3Client({
    region: REGION,
    credentials
});
const uuid = require('uuid');
// const { fromIni } = require("@aws-sdk/credential-providers");
// const { HttpRequest } = require("@smithy/protocol-http");
const {
  getSignedUrl,
  S3RequestPresigner,
} = require("@aws-sdk/s3-request-presigner");
// const { parseUrl } = require("@smithy/url-parser");
// const { formatUrl } = require("@aws-sdk/util-format-url");
// const { Hash } = require("@smithy/hash-node");
const { Upload } = require('@aws-sdk/lib-storage');
const { Readable,PassThrough } = require('stream');

const envMap = {
    "development": "dev",
    "test": "test",
    "production": "prod",
    "production_worker": "prod",
    "development_worker": "dev"
}

const aclMap = {
    "public": "public-read",
    "private": "private",
}

module.exports = {

    async deletePublicAccessBlock(bucketName) {
        const command = new DeletePublicAccessBlockCommand({
            Bucket: bucketName
        })
        const response = await s3Client.send(command)
        return response;

    },
    async putPublicAccess(bucketName) {
        const command = new PutPublicAccessBlockCommand({
            Bucket: bucketName,
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: false,
                IgnorePublicAcls: false,
                BlockPublicPolicy: false,
                RestrictPublicBuckets: false,
            },
        })
        const response = await s3Client.send(command)
        return response
    },

    async putObject(bucketName, key) {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key
        })
        const response = await s3Client.send(command)
        return response;
    },


    async createBucket(name, acl) {
        const command = new CreateBucketCommand({
            Bucket: name,
            ObjectOwnership: 'BucketOwnerPreferred',
        })
        const response = await s3Client.send(command);
        if (acl === 'public-read') {
            await this.putPublicAccess(name)
        }
        return response
    },
    async deleteBucket(name) {
        const command = new DeleteBucketCommand({
            Bucket: name,
        })
        const response = await s3Client.send(command)
        return response
    },
    async listBuckets() {
        const command = new ListBucketsCommand({});
        const response = await s3Client.send(command);
        return response.Buckets;
    },
    async upload({type, data, name, isFile = false, acl = "private", generatedId}) {
        let availableBuckets = await this.listBuckets();
        let bucketName = `technoob-${envMap[env]}`;
        if (acl && ["public", "private"].includes(acl)) {
            bucketName = `${bucketName}-${aclMap[acl]}`
        }
        if (!availableBuckets.find(bucket => bucket.Name === bucketName)) {
            await this.createBucket(bucketName, aclMap[acl])
        }
        const key = `${type}/${name}`;
        let resp;
        if (isFile ) {
            const stream = data instanceof PassThrough ? data : Readable.from(data)
            const upload = new Upload({
                client: s3Client,
                params: {
                    Bucket: bucketName,
                    Key: key,
                    Body: stream,
                    ContentType: 'text/plain',
                },
            });
            resp = await upload.done();
        } else {
            const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: data
            })
            resp = await s3Client.send(command)
        }
        const response = {
            name: name,
            url: `https://${bucketName}.s3.amazonaws.com/${key}`,
            requestId: resp.$metadata.requestId,
            message: `Object was uploaded successfully.`
        }

        if (acl === "private") {
            if (!generatedId) {
                generatedId = uuid.v4()
            }
            response.url = `https://${config.LIVE_BASE_URL}/api/v1/download/${bucketName}/${generatedId}`
            response.generatedId = generatedId;
            response.key = key;
        } else {
            await s3Client.send(new PutObjectAclCommand({
                Bucket: bucketName,
                Key: key,
                ACL: "public-read"
            }))
        }
        return response
    },

    async delete(url) {
        const parts = url.replace(/^(https?:\/\/)?/, '').split('/');
        const bucketName = parts[0].split('.')[0];
        const objectKey = parts[1];
        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
        })
        const response = await s3Client.send(command)
        return response;
    },

    async download({ storeName, generatedId, key }) {

        const createPresignedUrlWithClient = ({ region, bucket, key }) => {
            const client = new S3Client({ region });
            const command = new GetObjectCommand({ Bucket: bucket, Key: key });
            return getSignedUrl(client, command, { expiresIn: 3600 });
        };

        const clientUrl = await createPresignedUrlWithClient({
            region: REGION,
            bucket: storeName,
            key: key,
        });
        return clientUrl;
    }
}