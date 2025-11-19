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
    const { bytesWritten } = await fileHandle.write("Hello file", 0, "utf8");
    const dataBuffer = await fileHandle.readFile({ encoding: "utf8" });
    console.log(`fs.promises read: ${dataBuffer}`);
  } catch (err) {
    console.log("A error occurred.", err);
  }
};

doFileOperations();
// Streams for large files- log first 40 chars of each chunk
