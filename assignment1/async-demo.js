const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const MYPATH = path.join(__dirname, "sample-files", "sample.txt");

const data = "Hello, async world!";
const buffer = Buffer.from(data);
// Write a sample file for demonstration
const doFileOperations = async () => {
  let fileHandle;
  try {
    fileHandle = await fsp.open(MYPATH, "w");
    await fileHandle.write(buffer, 0, buffer.length);
  } catch (err) {
    console.log("A error occurred.", err);
  } finally {
    await fileHandle.close();
  }
};

doFileOperations();
// 1. Callback style
fs.readFile(MYPATH, "utf8", (err, data) => {
  if (err) {
    console.log("error:", err);
    return;
  }
  console.log(`Callback read: ${data}`);
});

// Callback hell example (test and leave it in comments):
// here you can see how every nestetd callback create a triangular structure
// fs.readFile(MYPATH, "utf8", (err, data) => {
//   if (err) {
//     console.log("error:", err);
//     return;
//   }
//   console.log(data);
//   fs.readFile(MY_SECOND_PATH,"utf8",(err, data)=>{
//       if (err) {
//         console.log("error:", err);
//         return;
//        }
//       console.log("second file readed")
//       fs.readFile(MY_THIRD_PATH, "utf8",(err,data)=>{
//         if(err){
//               console.log("error:", err);
//         return;
//       }
//       console.log("third file readed")
//     });
//   });
// });

// 2. Promise style

function promisifyMyFunction(myPath, encoding) {
  return new Promise((resolve, reject) => {
    fs.readFile(myPath, encoding, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}

promisifyMyFunction(MYPATH, "utf8")
  .then((data) => {
    console.log(`Promise read: ${data}`);
  })
  .catch((err) => {
    console.log(err);
  });

// 3. Async/Await style
async function myAsyncFunction() {
  try {
    const data = await promisifyMyFunction(MYPATH, "utf8");
    console.log(`Async/Await read: ${data}`);
  } catch (err) {
    console.log(err);
  }
}
myAsyncFunction();
