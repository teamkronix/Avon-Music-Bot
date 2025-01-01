const fs = require("fs").promises;
const path = require("path");
const { client } = require("../manasontop");
const AvonDispatcher = require("../Handlers/Fakeguildwalebot");

module.exports = class Loader {
  constructor(client) {
    this.client = client;
    this.eventsDir = path.resolve("./source/Events/Client");
    this.Load();
  }
  async Load() {
    await Promise.all([
      this.LoadCommands(),
      this.LoadClientEvents(),
      this.handleDispatcher(),
    ]);
  }
  async handleDispatcher() {
   await AvonDispatcher(this.client, this.client.kazagumo);
  }
  async LoadClientEvents() {
    try {
      const eventFiles = await this.getEventFiles(this.eventsDir);
      const loadPromises = eventFiles.map(async (file) => {
        try {
          const event = require(path.join(this.eventsDir, file));
          const eventName = path.basename(file, ".js");
          this.client.on(eventName, event.bind(null, this.client));
          console.log(`: Loaded event : ${eventName}`);
          return true;
        } catch (error) {
          console.error(`Failed to load event ${file}: ${error.message}`);
          return false;
        }
      });

      const results = await Promise.all(loadPromises);
      const eventCount = results.filter(Boolean).length;
      console.log(`Loaded ${eventCount} client events`);
    } catch (error) {
      console.error(`Failed to load client events: ${error.message}`);
    }
  }

  async getEventFiles(dir) {
    const files = await fs.readdir(dir);
    const eventFiles = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
          return this.getEventFiles(filePath);
        } else if (file.endsWith(".js")) {
          return file;
        }
      })
    );
    return eventFiles.flat().filter(Boolean);
  }
  async LoadCommands() {
    try {
      let messageCommandsCount = 0;
      const commandsDir = path.resolve("./source/Commands");
      const commandDirectories = await fs.readdir(commandsDir);
      const commandPromises = commandDirectories.map(async (dir) => {
        const cmdPath = path.resolve(commandsDir, dir);
        const isDir = await this.isDirectory(cmdPath);
        if (isDir) {
          const commands = await fs.readdir(cmdPath);
          return Promise.all(
            commands
              .filter((cmd) => cmd.endsWith(".js"))
              .map(async (cmd) => {
                const filePath = path.resolve(cmdPath, cmd);
                try {
                  const command = require(filePath);
                  this.validateAndStoreCommand(command, this.client);
                  messageCommandsCount++;
                } catch (importError) {
                  console.error(
                    `Failed to import command from ${filePath}:`,
                    importError
                  );
                }
              })
          );
        }
      });
      await Promise.all(commandPromises);
      console.log(`${messageCommandsCount} commands loaded`);
    } catch (error) {
      console.error("An error occurred while loading commands:", error);
    }
  }
  async isDirectory(path) {
    const stats = await fs.stat(path);
    return stats.isDirectory();
  }
  validateAndStoreCommand(command, client) {
    if (
      command &&
      typeof command === "object" &&
      typeof command.name === "string" &&
      typeof command.run === "function"
    ) {
      client.commands.set(command.name, command);
    } else {
      console.error(
        `Failed Loading Command: Invalid structure for command: ${command?.name}`
      );
    }
  }
};
