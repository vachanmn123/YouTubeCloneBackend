const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const fs = require("fs");

// Set the path to the ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Create a new S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  endpoint: process.env.AWS_ENDPOINT,
  forcePathStyle: true,
});

/**
 * Generate HLS files for a video
 * @param {String} videoKey
 */
async function generateHLS(videoKey) {
  // Remove the file extension
  const newVideoKey = videoKey.split(".").slice(0, -1).join(".");
  // Get the video from S3 bucket
  const vid = await s3.send(
    new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: videoKey,
    }),
  );
  // Create a directory to store the HLS files
  if (!fs.existsSync(`./tmp/${newVideoKey}`)) {
    fs.mkdirSync(`./tmp/${newVideoKey}/hls`, {
      recursive: true,
    });
  }
  // Save the video to the server
  await vid.Body.pipe(
    fs.createWriteStream(
      `./tmp/${newVideoKey}/${newVideoKey.split("/").pop()}`,
    ),
  );
  // Generate the HLS files - .m3u8 and .ts
  ffmpeg(`./tmp/${newVideoKey}/${newVideoKey.split("/").pop()}`, {
    timeOut: 432000,
  })
    .addOptions([
      "-profile:v baseline", // baseline profile (level 3.0) for H264 video codec
      "-level 3.0", // baseline profile (level 3.0) for H264 video codec
      "-start_number 0", // start the first .ts segment at index 0
      "-hls_time 10", // 10 second segment duration
      "-hls_list_size 0", // Maxmimum number of playlist entries
      "-f hls", // HLS format
    ])
    .output(`./tmp/${newVideoKey}/hls/${newVideoKey.split("/").pop()}-hls.m3u8`) // output file
    .on("end", async () => {
      // Upload the HLS files to the S3 bucket
      const files = fs.readdirSync(`./tmp/${newVideoKey}/hls`);
      for (const file of files) {
        const fileStream = fs.createReadStream(
          `./tmp/${newVideoKey}/hls/${file}`,
        );
        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `${newVideoKey}/hls/${file}`,
            Body: fileStream,
          }),
        );
      }
      // Clean up the server
      fs.rm(`./tmp/${newVideoKey}`, { recursive: true, force: true }, (err) => {
        if (err) {
          console.error(err);
          return;
        }
      });
    })
    .on("error", () => {
      // Clean up the server and log error
      console.error("Error: ");
      fs.rm(`./tmp/${newVideoKey}`, { recursive: true, force: true }, (err) => {
        if (err) {
          console.error(err);
          return;
        }
      });
    })
    .run();
}

module.exports = generateHLS;
