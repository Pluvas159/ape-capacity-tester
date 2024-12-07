const { app, BrowserWindow, ipcMain } = require("electron");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const path = require("path");

let mainWindow;
let serialPort;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 1000,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("index.html");
}

app.whenReady().then(createWindow);

// List available ports
ipcMain.handle("list-ports", async () => {
  const ports = await SerialPort.list();
  return ports;
});

// Connect to port
ipcMain.handle("connect-port", async (event, portPath) => {
  try {
    serialPort = new SerialPort({
      path: portPath,
      baudRate: 9600,
    });

    const parser = serialPort.pipe(new ReadlineParser({ delimiter: "\r\n" }));

    parser.on("data", (data) => {
      mainWindow.webContents.send("serial-data", data);
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Send data to Arduino
ipcMain.handle("send-data", async (event, data) => {
  if (serialPort && serialPort.isOpen) {
    serialPort.write(data);
    return { success: true };
  }
  return { success: false, error: "Port not connected" };
});
