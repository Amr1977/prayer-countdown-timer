# 🕌 Muslim Prayer Countdown Timer

[![Python Version](https://img.shields.io/badge/python-3.7+-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com)

A professional, feature-rich prayer time tracker and countdown timer for Muslims worldwide. Automatically detects your location, displays accurate prayer times, and provides intelligent audio notifications that increase in frequency as prayer time approaches.

---

## ✨ Features

### 🌍 **Automatic Location Detection**
- **IP-based geolocation** - Automatically detects your city and country
- **Persistent configuration** - Saves location for offline use
- **Manual override** - Edit configuration file for precise coordinates
- **Global coverage** - Works anywhere in the world

### ⏰ **Intelligent Countdown System**
- **Real-time countdown** - Live display of time remaining until next prayer
- **Smart announcements** - Frequency increases as prayer time approaches:
  - 3 hours, 2 hours, 90 min, 60 min, 45 min, 30 min, 20 min before prayer
  - **Final 20 minutes**: Per-minute announcements (19 min, 18 min, 17 min...)
- **Visual indicators** - Clear terminal display with prayer name and remaining time

### 🎵 **Audio Features**
- **Automatic Azan playback** - Plays beautiful Azan at exact prayer time
- **Default Azan included** - Downloads high-quality Azan automatically
- **Custom Azan support** - Use your preferred Azan recording
- **Voice announcements** - Text-based notifications for time remaining

### 📅 **Prayer Time Management**
- **Accurate calculations** - Uses the Aladhan API for precise times
- **Multiple calculation methods** - Support for various Islamic authorities
- **Daily schedule display** - Shows all 5 prayer times at startup
- **Automatic date handling** - Seamlessly transitions to next day's prayers

### 🎯 **User Experience**
- **Zero configuration** - Works out of the box with auto-detection
- **Persistent settings** - Remembers your preferences
- **Cross-platform** - Runs on Windows, macOS, and Linux
- **Lightweight** - Minimal resource usage

---

## 📋 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Usage Examples](#-usage-examples)
- [API Reference](#-api-reference)
- [Calculation Methods](#-calculation-methods)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

---

## 🚀 Installation

### Prerequisites

- **Python 3.7 or higher**
- **Internet connection** (for initial setup and daily prayer time updates)
- **Audio output device** (speakers/headphones for Azan playback)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/muslim-prayer-timer.git
cd muslim-prayer-timer
```

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

**Or install manually:**

```bash
pip install pygame requests
```

### Step 3: Run the Application

```bash
python prayer_timer.py
```

---

## ⚡ Quick Start

### First Run

On your first run, the application will:

1. **Detect your location** automatically using IP geolocation
2. **Create a configuration file** (`prayer_config.json`)
3. **Download the default Azan** file (`azan.mp3`)
4. **Fetch today's prayer times** from the API
5. **Display the prayer schedule** and start the countdown

**Example Output:**

```
⚙ Configuration file not found. Creating new configuration...
📍 Auto-detecting location...
✓ Location detected: New York, United States
✓ Coordinates: 40.7128, -74.0060
✓ Configuration saved to prayer_config.json

============================================================
🕌 PRAYER TIMES FOR FRIDAY, DECEMBER 06, 2024
📍 New York, United States
============================================================
  Fajr       : 05:51
  Dhuhr      : 11:54
  Asr        : 14:29
  Maghrib    : 16:32
  Isha       : 17:54
============================================================

⏰ Timer started. Press Ctrl+C to exit.

⏰ Next Prayer: Dhuhr    at 11:54 | Time Remaining: 2h 15m 43s
```

### Basic Operation

The timer runs continuously and will:

- Display a **live countdown** to the next prayer
- Make **audio announcements** at strategic intervals
- Play the **Azan** at the exact prayer time
- **Automatically advance** to the next prayer

Press **Ctrl+C** to stop the timer gracefully.

---

## ⚙️ Configuration

### Configuration File Structure

The application creates a `prayer_config.json` file with the following structure:

```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "city": "New York",
  "country": "United States",
  "method": 2,
  "azan_file": "azan.mp3",
  "use_default_azan": true,
  "announcement_voice": true
}
```

### Configuration Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `latitude` | float | Geographic latitude of your location | Auto-detected |
| `longitude` | float | Geographic longitude of your location | Auto-detected |
| `city` | string | City name | Auto-detected |
| `country` | string | Country name | Auto-detected |
| `method` | integer | Prayer time calculation method (0-7) | 2 (ISNA) |
| `azan_file` | string | Path to Azan audio file | "azan.mp3" |
| `use_default_azan` | boolean | Download default Azan if file missing | true |
| `announcement_voice` | boolean | Enable voice announcements | true |

### Manual Configuration

To manually set your location:

1. **Edit `prayer_config.json`** after first run
2. **Update coordinates** with precise latitude/longitude
3. **Choose calculation method** appropriate for your region
4. **Save the file** and restart the application

**Example: Setting location for London, UK**

```json
{
  "latitude": 51.5074,
  "longitude": -0.1278,
  "city": "London",
  "country": "United Kingdom",
  "method": 3,
  "azan_file": "azan.mp3",
  "use_default_azan": true,
  "announcement_voice": true
}
```

### Custom Azan File

To use your own Azan:

1. **Place your MP3 file** in the application directory
2. **Name it `azan.mp3`** or update `azan_file` in config
3. **Set `use_default_azan` to false** to prevent override
4. **Restart the application**

**Supported formats:** MP3, WAV, OGG (via pygame)

---

## 📖 Usage Examples

### Example 1: Standard Daily Use

```bash
# Start the timer
python prayer_timer.py

# Output shows:
# - Today's prayer schedule
# - Live countdown to next prayer
# - Announcements at intervals
# - Azan at prayer time
```

### Example 2: Running in Background (Linux/macOS)

```bash
# Run in background with nohup
nohup python prayer_timer.py > prayer.log 2>&1 &

# View live output
tail -f prayer.log

# Stop the process
pkill -f prayer_timer.py
```

### Example 3: Auto-start on System Boot

**Linux (systemd):**

Create `/etc/systemd/system/prayer-timer.service`:

```ini
[Unit]
Description=Muslim Prayer Timer
After=network.target

[Service]
Type=simple
User=yourusername
WorkingDirectory=/path/to/prayer-timer
ExecStart=/usr/bin/python3 /path/to/prayer-timer/prayer_timer.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable prayer-timer.service
sudo systemctl start prayer-timer.service
```

**Windows (Task Scheduler):**

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: At system startup
4. Action: Start a program
5. Program: `python.exe`
6. Arguments: `C:\path\to\prayer_timer.py`

**macOS (launchd):**

Create `~/Library/LaunchAgents/com.user.prayertimer.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.user.prayertimer</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/path/to/prayer_timer.py</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

Load the agent:

```bash
launchctl load ~/Library/LaunchAgents/com.user.prayertimer.plist
```

---

## 🔧 API Reference

### Prayer Time API

The application uses the **Aladhan Prayer Times API**:

- **Base URL:** `http://api.aladhan.com/v1/timings`
- **Documentation:** [aladhan.com/prayer-times-api](https://aladhan.com/prayer-times-api)
- **Rate Limits:** None for reasonable use
- **Response Format:** JSON

**Sample Request:**

```
GET http://api.aladhan.com/v1/timings/06-12-2024
    ?latitude=40.7128
    &longitude=-74.0060
    &method=2
```

**Sample Response:**

```json
{
  "code": 200,
  "data": {
    "timings": {
      "Fajr": "05:51",
      "Dhuhr": "11:54",
      "Asr": "14:29",
      "Maghrib": "16:32",
      "Isha": "17:54"
    }
  }
}
```

### Location Detection API

Uses **IP-API.com** for geolocation:

- **Base URL:** `http://ip-api.com/json/`
- **Free tier:** 45 requests/minute
- **Response Format:** JSON

---

## 📐 Calculation Methods

Different Islamic authorities use various methods to calculate prayer times. Choose the method most appropriate for your region:

| Method ID | Authority | Regions |
|-----------|-----------|---------|
| `0` | Shia Ithna-Ashari | Shia communities worldwide |
| `1` | University of Islamic Sciences, Karachi | Pakistan, India, Bangladesh, Afghanistan |
| `2` | **Islamic Society of North America (ISNA)** | **USA, Canada (Default)** |
| `3` | Muslim World League | Europe, Far East, parts of US |
| `4` | Umm Al-Qura University, Makkah | Saudi Arabia, Gulf countries |
| `5` | Egyptian General Authority of Survey | Egypt, Levant, Iraq |
| `7` | Institute of Geophysics, University of Tehran | Iran |
| `8` | Gulf Region | Kuwait, Qatar, Bahrain, UAE |

**Recommendation:** Use method `2` (ISNA) for North America, method `3` (MWL) for Europe, and method `4` (Umm Al-Qura) for Middle East.

---

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### **Issue: Location detection fails**

**Symptoms:**
```
⚠ Location detection failed: Connection timeout
⚠ Using default location: Mecca, Saudi Arabia
```

**Solutions:**
1. Check your internet connection
2. Verify firewall isn't blocking `ip-api.com`
3. Manually set location in `prayer_config.json`
4. Use a VPN if IP-API is blocked in your region

---

#### **Issue: Prayer times seem incorrect**

**Symptoms:** Prayer times don't match local mosque times

**Solutions:**
1. **Verify your calculation method** - Different mosques use different methods
2. **Check coordinates accuracy** - Ensure latitude/longitude are precise
3. **Compare with local mosque** - Ask which calculation method they use
4. **Adjust manually** - Some mosques add/subtract minutes for safety margin

---

#### **Issue: Azan doesn't play**

**Symptoms:**
```
⚠ Error playing azan: Unable to load audio file
```

**Solutions:**
1. **Check audio file exists:** Verify `azan.mp3` is in directory
2. **Test audio system:** Try playing other audio files
3. **Install audio codecs:** 
   ```bash
   # Linux
   sudo apt-get install libsdl2-mixer-2.0-0
   
   # macOS
   brew install sdl2_mixer
   ```
4. **Check file format:** Ensure file is valid MP3/WAV/OGG
5. **Re-download default:** Delete `azan.mp3` and set `use_default_azan: true`

---

#### **Issue: High CPU usage**

**Symptoms:** Application uses excessive CPU resources

**Solutions:**
1. The 1-second update interval is normal
2. For lower CPU usage, modify the `time.sleep(1)` value in code
3. Run in background/minimize terminal window
4. Close other resource-intensive applications

---

#### **Issue: Announcements not showing**

**Symptoms:** No interval announcements appear

**Solutions:**
1. Ensure `announcement_voice: true` in config
2. Check console output isn't being redirected
3. Verify system time is correct
4. Wait for proper announcement intervals (180, 120, 90, 60, 45, 30, 20 minutes)

---

#### **Issue: ModuleNotFoundError**

**Symptoms:**
```
ModuleNotFoundError: No module named 'pygame'
```

**Solutions:**
```bash
# Reinstall dependencies
pip install --upgrade pygame requests

# Or use pip3 explicitly
pip3 install pygame requests

# Check Python version
python --version  # Should be 3.7+
```

---

### Debug Mode

For detailed debugging, modify the code to add verbose logging:

```python
import logging

logging.basicConfig(level=logging.DEBUG)
```

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

1. **Report bugs** - Open an issue with detailed reproduction steps
2. **Suggest features** - Share ideas for improvements
3. **Submit pull requests** - Fix bugs or add features
4. **Improve documentation** - Help make docs clearer
5. **Translate** - Add support for other languages
6. **Share feedback** - Let us know how you use the app

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/muslim-prayer-timer.git
cd muslim-prayer-timer

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install development dependencies
pip install -r requirements-dev.txt

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and test thoroughly

# Submit a pull request
```

### Code Style

- Follow **PEP 8** Python style guide
- Add **docstrings** to all functions and classes
- Include **type hints** where appropriate
- Write **clear commit messages**
- Add **unit tests** for new features

### Pull Request Process

1. Update documentation for any changed functionality
2. Add tests covering your changes
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Request review from maintainers

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Muslim Prayer Timer Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 🙏 Acknowledgments

### APIs and Services

- **[Aladhan Prayer Times API](https://aladhan.com/)** - Accurate prayer time calculations
- **[IP-API.com](https://ip-api.com/)** - Geolocation services

### Libraries

- **[Pygame](https://www.pygame.org/)** - Audio playback functionality
- **[Requests](https://requests.readthedocs.io/)** - HTTP library for API calls

### Contributors

Special thanks to all contributors who have helped improve this project.

### Inspiration

This project was created to help Muslims maintain their prayer schedule and strengthen their connection with Allah (SWT). May it be a means of benefit for all who use it.

---

## 📞 Support

### Getting Help

- **GitHub Issues:** [github.com/yourusername/muslim-prayer-timer/issues](https://github.com/yourusername/muslim-prayer-timer/issues)
- **Email:** support@example.com
- **Documentation:** [Full documentation](https://github.com/yourusername/muslim-prayer-timer/wiki)

### Community

- **Discussions:** Share ideas and ask questions
- **Discord:** Join our community server
- **Twitter:** Follow [@PrayerTimer](https://twitter.com/prayertimer)

---

## 🗺️ Roadmap

### Planned Features

- [ ] **GUI version** with system tray integration
- [ ] **Mobile app** for iOS and Android
- [ ] **Web dashboard** for remote monitoring
- [ ] **Multiple location profiles** for travelers
- [ ] **Qibla direction** indicator
- [ ] **Islamic calendar** integration
- [ ] **Prayer tracking** and statistics
- [ ] **Reminder customization** per prayer
- [ ] **Multi-language support**
- [ ] **Hijri date display**

### Version History

#### v1.0.0 (Current)
- Initial release
- Auto location detection
- Intelligent countdown timer
- Azan playback
- Configuration management

---

## 📊 Statistics

![GitHub stars](https://img.shields.io/github/stars/yourusername/muslim-prayer-timer?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/muslim-prayer-timer?style=social)
![GitHub issues](https://img.shields.io/github/issues/yourusername/muslim-prayer-timer)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/muslim-prayer-timer)

---

<div align="center">

**Made with ❤️ for the Muslim community**

*"Indeed, prayer has been decreed upon the believers a decree of specified times."* - **Quran 4:103**

[⬆ Back to Top](#-muslim-prayer-countdown-timer)

</div>