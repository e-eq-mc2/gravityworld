// preload.js

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  //const replaceText = (selector, text) => {
  //  const element = document.getElementById(selector)
  //  if (element) element.innerText = text
  //}

  //for (const dependency of ['chrome', 'node', 'electron']) {
  //  replaceText(`${dependency}-version`, process.versions[dependency])
  //}

//const electron = require('electron')
//const remote = electron.remote
//
//const size = remote.getCurrentWindow().webContents.getOwnerBrowserWindow().getBounds()
//
//  const element = document.getElementById("world")
//  element.width =  window.width;
//  element.height =  window.height;
//  console.log(size);
})
