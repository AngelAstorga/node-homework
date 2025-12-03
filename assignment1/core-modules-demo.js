const os = require("os");
const path = require("path");
const fs = require("fs");

const sampleFilesDir = path.join(__dirname, "sample-files");
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
console.log(`Platform: ${os.platform}`);
console.log(`CPU: ${os.arch}`);
console.log(`Total Memory: ${os.totalmem}`);

// Path module
const MY_NEW_PATH = path.join(__dirname, "sample-files", "demo.txt");
console.log(`Joined path: ${MY_NEW_PATH}`);
// fs.promises API
const fsPromises = require("fs/promises");

const doFileOperations = async () => {
  try {
    const fileHandle = await fsPromises.open(MY_NEW_PATH, "w+");
    const { bytesWritten } = await fileHandle.write(
      "Hello from fs.promises!",
      0,
      "utf8"
    );
    const stats = await fileHandle.stat();
    const size = stats.size;

    const buffer = Buffer.alloc(size);
    const { bytesRead } = await fileHandle.read(buffer, 0, size, 0);
    const dataBuffer = buffer.toString("utf8");
    console.log(`fs.promises read: ${dataBuffer}`);
  } catch (err) {
    console.log("A error occurred.", err);
  }
};

doFileOperations();

// Streams for large files- log first 40 chars of each chunk
// creating the largefile.txt
const data = `This is line 1 of the approximately 100 lines requested.
This is line 2 of the approximately 100 lines requested.
This is line 3 of the approximately 100 lines requested.
This is line 4 of the approximately 100 lines requested.
This is line 5 of the approximately 100 lines requested.
This is line 6 of the approximately 100 lines requested.
This is line 7 of the approximately 100 lines requested.
This is line 8 of the approximately 100 lines requested.
This is line 9 of the approximately 100 lines requested.
This is line 10 of the approximately 100 lines requested.
This is line 11 of the approximately 100 lines requested.
This is line 12 of the approximately 100 lines requested.
This is line 13 of the approximately 100 lines requested.
This is line 14 of the approximately 100 lines requested.
This is line 15 of the approximately 100 lines requested.
This is line 16 of the approximately 100 lines requested.
This is line 17 of the approximately 100 lines requested.
This is line 18 of the approximately 100 lines requested.
This is line 19 of the approximately 100 lines requested.
This is line 20 of the approximately 100 lines requested.
This is line 21 of the approximately 100 lines requested.
This is line 22 of the approximately 100 lines requested.
This is line 23 of the approximately 100 lines requested.
This is line 24 of the approximately 100 lines requested.
This is line 25 of the approximately 100 lines requested.
This is line 26 of the approximately 100 lines requested.
This is line 27 of the approximately 100 lines requested.
This is line 28 of the approximately 100 lines requested.
This is line 29 of the approximately 100 lines requested.
This is line 30 of the approximately 100 lines requested.
This is line 31 of the approximately 100 lines requested.
This is line 32 of the approximately 100 lines requested.
This is line 33 of the approximately 100 lines requested.
This is line 34 of the approximately 100 lines requested.
This is line 35 of the approximately 100 lines requested.
This is line 36 of the approximately 100 lines requested.
This is line 37 of the approximately 100 lines requested.
This is line 38 of the approximately 100 lines requested.
This is line 39 of the approximately 100 lines requested.
This is line 40 of the approximately 100 lines requested.
This is line 41 of the approximately 100 lines requested.
This is line 42 of the approximately 100 lines requested.
This is line 43 of the approximately 100 lines requested.
This is line 44 of the approximately 100 lines requested.
This is line 45 of the approximately 100 lines requested.
This is line 46 of the approximately 100 lines requested.
This is line 47 of the approximately 100 lines requested.
This is line 48 of the approximately 100 lines requested.
This is line 49 of the approximately 100 lines requested.
This is line 50 of the approximately 100 lines requested.
This is line 51 of the approximately 100 lines requested.
This is line 52 of the approximately 100 lines requested.
This is line 53 of the approximately 100 lines requested.
This is line 54 of the approximately 100 lines requested.
This is line 55 of the approximately 100 lines requested.
This is line 56 of the approximately 100 lines requested.
This is line 57 of the approximately 100 lines requested.
This is line 58 of the approximately 100 lines requested.
This is line 59 of the approximately 100 lines requested.
This is line 60 of the approximately 100 lines requested.
This is line 61 of the approximately 100 lines requested.
This is line 62 of the approximately 100 lines requested.
This is line 63 of the approximately 100 lines requested.
This is line 64 of the approximately 100 lines requested.
This is line 65 of the approximately 100 lines requested.
This is line 66 of the approximately 100 lines requested.
This is line 67 of the approximately 100 lines requested.
This is line 68 of the approximately 100 lines requested.
This is line 69 of the approximately 100 lines requested.
This is line 70 of the approximately 100 lines requested.
This is line 71 of the approximately 100 lines requested.
This is line 72 of the approximately 100 lines requested.
This is line 73 of the approximately 100 lines requested.
This is line 74 of the approximately 100 lines requested.
This is line 75 of the approximately 100 lines requested.
This is line 76 of the approximately 100 lines requested.
This is line 77 of the approximately 100 lines requested.
This is line 78 of the approximately 100 lines requested.
This is line 79 of the approximately 100 lines requested.
This is line 80 of the approximately 100 lines requested.
This is line 81 of the approximately 100 lines requested.
This is line 82 of the approximately 100 lines requested.
This is line 83 of the approximately 100 lines requested.
This is line 84 of the approximately 100 lines requested.
This is line 85 of the approximately 100 lines requested.
This is line 86 of the approximately 100 lines requested.
This is line 87 of the approximately 100 lines requested.
This is line 88 of the approximately 100 lines requested.
This is line 89 of the approximately 100 lines requested.
This is line 90 of the approximately 100 lines requested.
This is line 91 of the approximately 100 lines requested.
This is line 92 of the approximately 100 lines requested.
This is line 93 of the approximately 100 lines requested.
This is line 94 of the approximately 100 lines requested.
This is line 95 of the approximately 100 lines requested.
This is line 96 of the approximately 100 lines requested.
This is line 97 of the approximately 100 lines requested.
This is line 98 of the approximately 100 lines requested.
This is line 99 of the approximately 100 lines requested.
This is line 100 of the approximately 100 lines requested.`;
const buffer = Buffer.from(data);

const MYPATH_LARGE = path.join(__dirname, "sample-files", "largefile.txt");

const createFile = async () => {
  let fileHandle;
  try {
    fileHandle = await fsPromises.open(MYPATH_LARGE, "w");
    await fileHandle.write(buffer, 0, buffer.length);
  } catch (err) {
    console.log("A error occurred.", err);
  } finally {
    await fileHandle.close();
  }
};

createFile();

const MY_NEW_PATH_LARGE = path.join(__dirname, "sample-files", "largefile.txt");
const readStream = async () => {
  const customHighWaterMark = 1024;
  try {
    const fileHandle = await fs.createReadStream(MY_NEW_PATH_LARGE, {
      encoding: "utf8",
      highWaterMark: customHighWaterMark,
    });
    fileHandle.on("data", (chunck) => {
      console.log("Read chunk: " + chunck.slice(0, 40));
    });
    fileHandle.on("end", () => {
      console.log("Finished reading large file with streams.");
    });
    fileHandle.on("error", (err) => {
      console.error("An error ocurred: ", err);
    });
  } catch (err) {
    console.log("A error occurred.", err);
  }
};

readStream();
