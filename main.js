const {app, BrowserWindow, ipcMain} = require('electron')
const fs=require('fs');
  process.env.NODE_ENV = "production";
  const path = require('path')
  const url = require('url')

  // Keep a global reference of the window object, if you don't, the window will
  // be closed automatically when the JavaScript object is garbage collected.
  let win
  let edit
  let result
  let Data
  let data
  const getfreshData=()=>{
    Data=fs.readFileSync(path.join(__dirname, 'category.json'), 'utf8');
    data=JSON.parse(Data);
  }
  const writeFilefunction=(arg, arg2 = 0)=>{
    fs.writeFile(path.join(__dirname, '/category.json'), JSON.stringify(arg), (err)=>{
      if (err) {
        return console.log(err);
      }
      console.log("data changed")
      win.webContents.send("cat:refresh")
      edit.webContents.send("cat:id", arg2);
    })
  }

  function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({width: 300, height: 500})

    // and load the index.html of the app.
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true,
      transparent: true,
      frame: false
    }))

    // Open the DevTools.
    // win.webContents.openDevTools()

    // Emitted when the window is closed.
    win.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      win = null
    })
  }
  function createEdit() {
    // Create the browser window.
    edit = new BrowserWindow({width: 300, height: 500})

    // and load the index.html of the app.
    edit.loadURL(url.format({
      pathname: path.join(__dirname, 'edit.html'),
      protocol: 'file:',
      slashes: true,
      transparent: true,
      frame: false
    }))

    // Open the DevTools.
    // edit.webContents.openDevTools()

    // Emitted when the window is closed.
    edit.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      edit = null
    })
  }
  function createResult() {
    // Create the browser window.
    result = new BrowserWindow({width: 350, height: 210})

    // and load the index.html of the app.
    result.loadURL(url.format({
      pathname: path.join(__dirname, 'result.html'),
      protocol: 'file:',
      slashes: true,
      transparent: true,
      frame: false
    }))

    // Open the DevTools.
    // result.webContents.openDevTools()

    // Emitted when the window is closed.
    result.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      edit = null
    })
  }


  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', ()=>{
    createWindow();
    createEdit();
    createResult();
    edit.hide();
    result.hide();
  })

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow()
    }
  })

  // In this file you can include the rest of your app's specific main process
  // code. You can also put them in separate files and require them here.
  //catch id
  ipcMain.on("cat:id", (e, id) =>{
    console.log(id);
    win.hide();
    edit.show();
    edit.webContents.send("cat:id", id);

    // createEdit(id, ()=>{
    //   edit.webContents.send("cat:id", id);
    // });
    // edit.webContents.send("cat:id", id);
  })

  ipcMain.on("cat:add", (e, item) =>{
    return writeFilefunction(item)
  })
  ipcMain.on("cat:delete", (e, item) =>{
    getfreshData();
    for (var i = 0; i < data.length; i++) {
      if (data[i].id==item.catId) {
        data.splice(i, 1)
        return writeFilefunction(data)
      }
    }
  })
  ipcMain.on("result:get", (e, item) =>{
    getfreshData();
    let randomPoint=Math.floor(Math.random()*data[item.indexId].contents.length);
    let rando=data[item.indexId].contents[randomPoint];
    data[item.indexId].contents.splice(randomPoint, 1);
    data[item.indexId].picked.push(rando);
    let senditem={
      rando:rando,
      catId:item.catId,
      indexId:item.indexId
    }
    console.log(senditem.rando);
    writeFilefunction(data)
    win.hide();
    result.show();
    win.webContents.send("cat:refresh")
    return result.webContents.send("result:make", senditem);
  })

  ipcMain.on("result:reset", (e, item) =>{
    getfreshData();
    for (var i = 0; i < data.length; i++) {
      if (data[i].id==item) {
        for (var j = data[i].picked.length-1; j >= 0; j--) {
          data[i].contents.push(data[i].picked[j]);
          data[i].picked.splice(j,1);
        }
        writeFilefunction(data);
        return
      }
    }
  })

  ipcMain.on("goback:cat", () =>{
    win.show();
    edit.hide();
    result.hide();
    win.webContents.send("cat:refresh")
  })

  ipcMain.on("contents:add", (e, item)=>{
    getfreshData();
    console.log(item.catId);
    for (var i = 0; i < data.length; i++) {
      if (data[i].id==item.catId) {
        data[i].contents.push(item.newItem)
        writeFilefunction(data, item.catId)
        console.log(item.catId)
        return
      }else{
        console.log("data not found")
      }
    }
  })

  ipcMain.on("contents:delete", (e, item)=>{
    getfreshData();
    for (var i = 0; i < data.length; i++) {
      if (data[i].id==item.catId) {
        console.log("data found");
        data[i].contents.splice(item.index, 1)
        writeFilefunction(data, item.catId)
        return
      }
    }
    console.log(data);
  })

  ipcMain.on("app:quit", ()=>{
    console.log("quit");
    app.quit()
  })
