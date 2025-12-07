// ============================================================================
// package.json
// ============================================================================
/*
{
  "name": "muslim-prayer-countdown-timer",
  "version": "1.0.0",
  "description": "Intelligent countdown timer for Muslim prayer times with auto location detection and smart notifications",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "keywords": [
    "prayer",
    "muslim",
    "islam",
    "countdown",
    "timer",
    "azan",
    "notification"
  ],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "axios": "^1.6.0",
    "chalk": "^4.1.2",
    "node-notifier": "^10.0.1",
    "node-schedule": "^2.1.1",
    "play-sound": "^1.1.6",
    "figlet": "^1.7.0",
    "ora": "^5.4.1",
    "inquirer": "^8.2.6"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
*/

// ============================================================================
// index.js - Main Application
// ============================================================================

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
const notifier = require('node-notifier');
const schedule = require('node-schedule');
const player = require('play-sound')({});
const figlet = require('figlet');
const ora = require('ora');
const inquirer = require('inquirer');

// Constants
const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const ANNOUNCEMENT_INTERVALS = [180, 120, 90, 60, 45, 30, 20]; // minutes
const CONFIG_FILE = path.join(__dirname, 'prayer_config.json');
const AZAN_FILE = path.join(__dirname, 'azan.mp3');
const DEFAULT_AZAN_URL = 'https://www.islamcan.com/audio/adhan/azan1.mp3';

class PrayerTimer {
  constructor() {
    this.config = null;
    this.prayerTimes = {};
    this.announcedIntervals = new Set();
    this.currentPrayerAnnounced = false;
    this.checkInterval = null;
  }

  // ========================================================================
  // Initialization
  // ========================================================================

  async initialize() {
    this.displayBanner();
    await this.loadOrCreateConfig();
    await this.fetchPrayerTimes();
    this.displayPrayerTimes();
    this.startTimer();
  }

  displayBanner() {
    console.clear();
    const banner = figlet.textSync('Prayer Timer', {
      font: 'Standard',
      horizontalLayout: 'default'
    });
    console.log(chalk.cyan(banner));
    console.log(chalk.gray('═'.repeat(70)));
    console.log(chalk.white.bold('🕌 Muslim Prayer Countdown Timer'));
    console.log(chalk.gray('═'.repeat(70)));
    console.log();
  }

  // ========================================================================
  // Configuration Management
  // ========================================================================

  async loadOrCreateConfig() {
    try {
      const data = await fs.readFile(CONFIG_FILE, 'utf8');
      this.config = JSON.parse(data);
      console.log(chalk.green('✓') + ' Configuration loaded');
      console.log(chalk.gray(`  Location: ${this.config.city}, ${this.config.country}`));
      console.log();
    } catch (error) {
      console.log(chalk.yellow('⚙') + '  Configuration file not found. Creating new configuration...');
      await this.createConfig();
    }
  }

  async createConfig() {
    const spinner = ora('Detecting your location...').start();
    
    const location = await this.detectLocation();
    spinner.succeed('Location detected');
    
    console.log(chalk.cyan(`  📍 ${location.city}, ${location.country}`));
    console.log(chalk.gray(`  Coordinates: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`));
    console.log();

    // Ask user if they want to customize
    const { customize } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'customize',
        message: 'Would you like to customize settings?',
        default: false
      }
    ]);

    if (customize) {
      location.method = await this.askCalculationMethod();
    }

    this.config = {
      ...location,
      playAzan: true,
      showNotifications: true,
      azanVolume: 0.7
    };

    await this.saveConfig();
    console.log(chalk.green('✓') + ' Configuration saved');
    console.log();
  }

  async detectLocation() {
    try {
      const response = await axios.get('http://ip-api.com/json/', { timeout: 5000 });
      const data = response.data;
      
      if (data.status === 'success') {
        return {
          latitude: data.lat,
          longitude: data.lon,
          city: data.city,
          country: data.country,
          method: 2 // ISNA
        };
      }
    } catch (error) {
      console.log(chalk.yellow('  ⚠ Location detection failed, using default (Mecca)'));
    }
    
    // Fallback to Mecca
    return {
      latitude: 21.4225,
      longitude: 39.8262,
      city: 'Mecca',
      country: 'Saudi Arabia',
      method: 2
    };
  }

  async askCalculationMethod() {
    const { method } = await inquirer.prompt([
      {
        type: 'list',
        name: 'method',
        message: 'Select prayer time calculation method:',
        choices: [
          { name: 'ISNA (North America)', value: 2 },
          { name: 'Muslim World League (Europe)', value: 3 },
          { name: 'Umm Al-Qura (Saudi Arabia)', value: 4 },
          { name: 'Karachi (South Asia)', value: 1 },
          { name: 'Egyptian General Authority', value: 5 },
          { name: 'Shia Ithna-Ashari', value: 0 },
          { name: 'Tehran', value: 7 },
          { name: 'Gulf Region', value: 8 }
        ],
        default: 2
      }
    ]);
    return method;
  }

  async saveConfig() {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(this.config, null, 2));
  }

  // ========================================================================
  // Prayer Times
  // ========================================================================

  async fetchPrayerTimes() {
    const spinner = ora('Fetching prayer times...').start();
    
    try {
      const today = new Date().toLocaleDateString('en-GB').split('/').join('-');
      const url = `http://api.aladhan.com/v1/timings/${today}`;
      
      const response = await axios.get(url, {
        params: {
          latitude: this.config.latitude,
          longitude: this.config.longitude,
          method: this.config.method
        },
        timeout: 10000
      });
      
      if (response.data.code === 200) {
        PRAYERS.forEach(prayer => {
          this.prayerTimes[prayer] = response.data.data.timings[prayer];
        });
        spinner.succeed('Prayer times fetched successfully');
      } else {
        spinner.fail('Failed to fetch prayer times');
        process.exit(1);
      }
    } catch (error) {
      spinner.fail('Failed to fetch prayer times: ' + error.message);
      process.exit(1);
    }
  }

  displayPrayerTimes() {
    const dateStr = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    console.log(chalk.cyan('═'.repeat(70)));
    console.log(chalk.white.bold(`📅 PRAYER TIMES - ${dateStr.toUpperCase()}`));
    console.log(chalk.cyan(`📍 ${this.config.city}, ${this.config.country}`));
    console.log(chalk.cyan('═'.repeat(70)));
    console.log();
    
    PRAYERS.forEach(prayer => {
      const time = this.prayerTimes[prayer];
      const isPassed = this.isPrayerPassed(time);
      const isNext = this.isNextPrayer(prayer);
      
      let line = '  ';
      
      if (isNext) {
        line += chalk.green.bold('→ ');
      } else {
        line += '  ';
      }
      
      line += isPassed 
        ? chalk.gray(`${prayer.padEnd(10)} : ${time}`)
        : chalk.white(`${prayer.padEnd(10)} : ${chalk.bold(time)}`);
      
      if (isNext) {
        line += chalk.green.bold(' ← NEXT');
      }
      
      console.log(line);
    });
    
    console.log();
    console.log(chalk.cyan('═'.repeat(70)));
    console.log();
  }

  isPrayerPassed(timeStr) {
    const now = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    const prayerTime = new Date();
    prayerTime.setHours(hours, minutes, 0, 0);
    return prayerTime < now;
  }

  isNextPrayer(prayer) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    for (const p of PRAYERS) {
      const [hours, minutes] = this.prayerTimes[p].split(':').map(Number);
      const prayerMinutes = hours * 60 + minutes;
      
      if (prayerMinutes > currentMinutes) {
        return p === prayer;
      }
    }
    
    return prayer === 'Fajr'; // Tomorrow's Fajr
  }

  getNextPrayer() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    for (const prayer of PRAYERS) {
      const [hours, minutes] = this.prayerTimes[prayer].split(':').map(Number);
      const prayerMinutes = hours * 60 + minutes;
      
      if (prayerMinutes > currentMinutes) {
        return { name: prayer, time: this.prayerTimes[prayer] };
      }
    }
    
    return { name: 'Fajr', time: this.prayerTimes['Fajr'] };
  }

  // ========================================================================
  // Timer and Notifications
  // ========================================================================

  startTimer() {
    console.log(chalk.yellow('⏰ Timer started. Press Ctrl+C to exit.'));
    console.log();
    
    // Initial check
    this.checkAndNotify();
    
    // Check every minute
    this.checkInterval = setInterval(() => {
      this.checkAndNotify();
    }, 60000); // 60 seconds
    
    // Also update display every second
    setInterval(() => {
      this.displayCountdown();
    }, 1000);
  }

  async checkAndNotify() {
    // Check if we need to fetch new prayer times (new day)
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      await this.fetchPrayerTimes();
      this.displayPrayerTimes();
      this.announcedIntervals.clear();
      this.currentPrayerAnnounced = false;
    }
    
    const { name: prayer, time } = this.getNextPrayer();
    const minutesRemaining = this.getMinutesRemaining(time);
    
    // Check if it's prayer time
    if (minutesRemaining <= 0 && !this.currentPrayerAnnounced) {
      await this.notifyPrayerTime(prayer);
      this.currentPrayerAnnounced = true;
      this.announcedIntervals.clear();
      setTimeout(() => this.displayPrayerTimes(), 2000);
      return;
    }
    
    if (minutesRemaining > 0) {
      this.currentPrayerAnnounced = false;
    }
    
    // Check for interval announcements
    if (ANNOUNCEMENT_INTERVALS.includes(minutesRemaining)) {
      if (!this.announcedIntervals.has(minutesRemaining)) {
        this.announcedIntervals.add(minutesRemaining);
        this.notifyTimeRemaining(prayer, minutesRemaining);
      }
    }
    
    // Per-minute announcements for last 20 minutes
    if (minutesRemaining > 0 && minutesRemaining < 20) {
      if (!this.announcedIntervals.has(minutesRemaining)) {
        this.announcedIntervals.add(minutesRemaining);
        this.notifyTimeRemaining(prayer, minutesRemaining);
      }
    }
  }

  getMinutesRemaining(timeStr) {
    const now = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    let prayerDate = new Date();
    prayerDate.setHours(hours, minutes, 0, 0);
    
    if (prayerDate < now) {
      prayerDate.setDate(prayerDate.getDate() + 1);
    }
    
    const diff = prayerDate - now;
    return Math.floor(diff / 60000);
  }

  displayCountdown() {
    const { name: prayer, time } = this.getNextPrayer();
    const [hours, minutes] = time.split(':').map(Number);
    
    let prayerDate = new Date();
    prayerDate.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    if (prayerDate < now) {
      prayerDate.setDate(prayerDate.getDate() + 1);
    }
    
    const diff = prayerDate - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    
    const countdown = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    
    // Clear line and display countdown
    process.stdout.write('\r' + ' '.repeat(100)); // Clear line
    process.stdout.write('\r' + 
      chalk.cyan('⏰ Next Prayer: ') + 
      chalk.white.bold(prayer.padEnd(8)) + 
      chalk.cyan(' at ') + 
      chalk.white.bold(time) + 
      chalk.cyan(' | Time Remaining: ') + 
      chalk.green.bold(countdown)
    );
  }

  async notifyPrayerTime(prayer) {
    console.log('\n');
    console.log(chalk.green('═'.repeat(70)));
    console.log(chalk.green.bold(`        🕌 IT'S TIME FOR ${prayer.toUpperCase()} PRAYER!        `));
    console.log(chalk.green('═'.repeat(70)));
    console.log();
    
    if (this.config.showNotifications) {
      notifier.notify({
        title: `🕌 ${prayer} Prayer Time`,
        message: `It's time for ${prayer} prayer. May Allah accept your prayer.`,
        sound: true,
        wait: true
      });
    }
    
    if (this.config.playAzan) {
      await this.playAzan();
    }
  }

  notifyTimeRemaining(prayer, minutes) {
    let message;
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      message = mins > 0 
        ? `${hours} hour(s) and ${mins} minute(s) until ${prayer} prayer`
        : `${hours} hour(s) until ${prayer} prayer`;
    } else {
      message = `${minutes} minute(s) until ${prayer} prayer`;
    }
    
    console.log('\n' + chalk.yellow('🔔 REMINDER: ') + chalk.white(message));
    
    if (this.config.showNotifications) {
      notifier.notify({
        title: '⏰ Prayer Reminder',
        message: message,
        sound: false
      });
    }
  }

  async playAzan() {
    // Download azan if not exists
    if (!await this.fileExists(AZAN_FILE)) {
      const spinner = ora('Downloading Azan...').start();
      try {
        const response = await axios.get(DEFAULT_AZAN_URL, {
          responseType: 'arraybuffer',
          timeout: 30000
        });
        await fs.writeFile(AZAN_FILE, response.data);
        spinner.succeed('Azan downloaded');
      } catch (error) {
        spinner.fail('Failed to download Azan');
        return;
      }
    }
    
    // Play azan
    console.log(chalk.cyan('🎵 Playing Azan...'));
    return new Promise((resolve) => {
      player.play(AZAN_FILE, (err) => {
        if (err) {
          console.log(chalk.red('⚠ Error playing Azan: ' + err.message));
        }
        resolve();
      });
    });
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // ========================================================================
  // Cleanup
  // ========================================================================

  cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    console.log('\n\n' + chalk.green('✓ Timer stopped. May Allah accept your prayers.'));
    process.exit(0);
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const timer = new PrayerTimer();
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    timer.cleanup();
  });
  
  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error(chalk.red('\n✗ Error: ' + error.message));
    timer.cleanup();
  });
  
  await timer.initialize();
}

// Start the application
if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('✗ Fatal error: ' + error.message));
    process.exit(1);
  });
}

module.exports = PrayerTimer;

// ============================================================================
// .gitignore
// ============================================================================
/*
node_modules/
prayer_config.json
azan.mp3
*.log
.env
.DS_Store
*/

// ============================================================================
// README.md
// ============================================================================
/*
# 🕌 Muslim Prayer Countdown Timer (Node.js)

A professional, feature-rich prayer time tracker and countdown timer for Muslims worldwide. Automatically detects your location, displays accurate prayer times, and provides intelligent notifications.

## ✨ Features

- ⏰ **Real-time Countdown** - Live countdown to next prayer
- 📍 **Auto Location Detection** - Automatically detects your location
- 🔔 **Smart Notifications** - Increasing frequency as prayer approaches
- 🎵 **Azan Playback** - Beautiful Azan at prayer time
- 🌍 **Global Coverage** - Works anywhere in the world
- ⚙️ **Flexible Configuration** - Multiple calculation methods

## 📋 Installation

### Prerequisites
- Node.js 14.0 or higher
- npm or yarn

### Install Dependencies
```bash
npm install
```

### Install globally (optional)
```bash
npm install -g .
```

## 🚀 Usage

### Run the timer
```bash
npm start
```

### Development mode (with auto-reload)
```bash
npm run dev
```

## ⚙️ Configuration

On first run, the app will:
1. Auto-detect your location
2. Create `prayer_config.json`
3. Download default Azan file
4. Fetch today's prayer times

### Manual Configuration

Edit `prayer_config.json`:
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "city": "New York",
  "country": "United States",
  "method": 2,
  "playAzan": true,
  "showNotifications": true,
  "azanVolume": 0.7
}
```

### Calculation Methods
- 0: Shia Ithna-Ashari
- 1: University of Islamic Sciences, Karachi
- 2: ISNA (North America) - **Default**
- 3: Muslim World League
- 4: Umm Al-Qura University
- 5: Egyptian General Authority
- 7: Institute of Geophysics, Tehran
- 8: Gulf Region

## 📦 Dependencies

- **axios** - HTTP client for API calls
- **chalk** - Terminal styling
- **node-notifier** - Cross-platform notifications
- **node-schedule** - Task scheduling
- **play-sound** - Audio playback
- **figlet** - ASCII art banner
- **ora** - Loading spinners
- **inquirer** - Interactive prompts

## 🎯 Smart Notification Schedule

- **3 hours before** prayer
- **2 hours before** prayer
- **90 minutes before** prayer
- **60 minutes before** prayer
- **45 minutes before** prayer
- **30 minutes before** prayer
- **20 minutes before** prayer
- **Last 20 minutes**: Per-minute notifications

## 🔊 Audio Requirements

The app requires audio playback capabilities:
- **macOS**: Built-in support
- **Windows**: Requires Windows Media Player
- **Linux**: Requires `mpg123` or `mplayer`

### Linux Setup
```bash
# Ubuntu/Debian
sudo apt-get install mpg123

# Fedora
sudo dnf install mpg123
```

## 📱 System Requirements

- **OS**: Windows, macOS, or Linux
- **Node.js**: 14.0 or higher
- **RAM**: 50MB minimum
- **Storage**: 10MB for app + 5MB for Azan file

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Aladhan API for prayer time calculations
- IP-API.com for geolocation services

---

**Made with ❤️ for the Muslim community**

*"Indeed, prayer has been decreed upon the believers a decree of specified times."* - **Quran 4:103**
*/
