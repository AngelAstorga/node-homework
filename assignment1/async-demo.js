const fs = require("fs");
const path = require("path");

const MYPATH = path.join(__dirname, "sample-files", "sample.txt");

// Write a sample file for demonstration

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
